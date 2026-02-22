"""
Backend-new: full API (auth, history, diagnose, frontend).
Diagnosis logic is in diagnosis_engine — replace that module to plug in a different model.
"""
import os
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError

from langchain_community.embeddings import HuggingFaceEmbeddings
import faiss

# -------------------- Configuration --------------------
LLM_BACKEND = os.getenv("LLM_BACKEND", "hf_local").strip().lower()
LITELLM_BASE_URL = os.getenv("LITELLM_BASE_URL", "https://hub.qazcode.ai/v1")
LITELLM_API_KEY = os.getenv("LITELLM_API_KEY", "")
HF_MODEL_NAME = os.getenv("HF_MODEL_NAME", "Qwen/Qwen2.5-0.5B-Instruct")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "cointegrated/rubert-tiny2")
FAISS_INDEX_PATH = os.path.join("data", "faiss_index")
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_local_frontend = os.path.join(_project_root, "frontend", "dist")
_sibling_frontend = os.path.normpath(os.path.join(_project_root, "..", "frontend", "dist"))
FRONTEND_DIST_PATH = os.getenv("FRONTEND_DIST_PATH", "").strip() or (
    _local_frontend if os.path.isdir(_local_frontend) else _sibling_frontend
)
SYSTEM_PROMPT_PATH = os.path.join(_project_root, "system_prompt.txt")
_SYSTEM_PROMPT_CACHE: Optional[str] = None


def _load_system_prompt() -> str:
    global _SYSTEM_PROMPT_CACHE
    if _SYSTEM_PROMPT_CACHE is not None:
        return _SYSTEM_PROMPT_CACHE
    try:
        with open(SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
            _SYSTEM_PROMPT_CACHE = f.read().strip()
            return _SYSTEM_PROMPT_CACHE
    except FileNotFoundError:
        logging.getLogger(__name__).warning("system_prompt.txt not found at %s", SYSTEM_PROMPT_PATH)
        _SYSTEM_PROMPT_CACHE = """Вы — экспертная медицинская система. Верните валидный JSON с полем "diagnoses" — массив из 3 объектов с полями icd10_code, diagnosis, explanation, protocol_id. Коды МКБ-10 только из строк "ОФИЦИАЛЬНЫЕ КОДЫ МКБ-10" в контексте."""
        return _SYSTEM_PROMPT_CACHE


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class AppState:
    faiss_index: Optional[faiss.Index] = None
    faiss_metadata: Optional[List[dict]] = None
    embeddings: Optional[HuggingFaceEmbeddings] = None
    llm_client: Optional[AsyncOpenAI] = None
    model_id: str = "gpt-oss"
    hf_model: Optional[object] = None
    hf_tokenizer: Optional[object] = None


state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting diagnosis service (backend-new)...")
    state.embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

    index_path = os.path.join(FAISS_INDEX_PATH, "index.faiss")
    meta_path = os.path.join(FAISS_INDEX_PATH, "metadata.json")
    if os.path.isfile(index_path) and os.path.isfile(meta_path):
        try:
            state.faiss_index = faiss.read_index(index_path)
            with open(meta_path, "r", encoding="utf-8") as f:
                import json
                state.faiss_metadata = json.load(f)
            if state.faiss_index.ntotal != len(state.faiss_metadata):
                state.faiss_index = None
                state.faiss_metadata = None
            else:
                logger.info("FAISS index loaded (%d vectors)", state.faiss_index.ntotal)
        except Exception as e:
            logger.error("Failed to load FAISS: %s", e)
            state.faiss_index = None
            state.faiss_metadata = None
    else:
        logger.warning("FAISS index not found at %s", index_path)

    if LLM_BACKEND == "hf_local":
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            state.hf_tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_NAME, trust_remote_code=True)
            state.hf_model = AutoModelForCausalLM.from_pretrained(
                HF_MODEL_NAME, device_map="auto", trust_remote_code=True, torch_dtype="auto"
            )
            state.hf_model.eval()
            logger.info("Local HF model loaded")
        except Exception as e:
            logger.error("Failed to load HF model: %s", e)
            state.hf_model = None
            state.hf_tokenizer = None
    else:
        state.llm_client = AsyncOpenAI(
            base_url=LITELLM_BASE_URL, api_key=LITELLM_API_KEY or "dummy",
            timeout=120.0, max_retries=3
        )
        try:
            models = await state.llm_client.models.list()
            for m in models.data:
                if "oss" in m.id.lower() or "120b" in m.id:
                    state.model_id = m.id
                    break
        except Exception as e:
            logger.warning("Model discovery failed: %s", e)

    try:
        from supabase_client import ensure_admin_user
        await ensure_admin_user("admin@example.com", "asdf1234")
    except Exception as e:
        logger.warning("ensure_admin_user failed: %s", e)

    yield
    logger.info("Shutdown complete.")


app = FastAPI(title="AI Diagnosis API (backend-new)", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# -------------------- Models --------------------
class DiagnoseRequest(BaseModel):
    symptoms: Optional[str] = None
    query: Optional[str] = None

    def get_query(self) -> str:
        return self.symptoms or self.query or ""


class DiagnosisItem(BaseModel):
    rank: int
    icd10_code: str
    diagnosis: str
    explanation: str
    protocol_id: str
    medelement_url: str = ""


class DiagnoseResponse(BaseModel):
    diagnoses: List[DiagnosisItem] = Field(default_factory=list)


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


def _auth_error_response(msg: str, is_register: bool) -> tuple:
    msg_lower = msg.lower()
    if "rate limit" in msg_lower or "too many" in msg_lower:
        return 429, "Слишком много попыток. Подождите несколько минут."
    if "already registered" in msg_lower or "already exists" in msg_lower:
        return 400, "Пользователь с таким email уже зарегистрирован."
    if "invalid" in msg_lower and ("password" in msg_lower or "email" in msg_lower):
        return 400, "Некорректный email или пароль."
    return (400 if is_register else 401), msg


async def _get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None
    try:
        from supabase_client import auth_user
        return await auth_user(token)
    except Exception:
        return None


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    user = await _get_current_user_optional(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    return user


def _auth_user_to_response(user: dict, access_token: str) -> dict:
    uid = user.get("id") or ""
    email = user.get("email") or ""
    meta = user.get("user_metadata") or {}
    name = meta.get("full_name") or email.split("@")[0] or "Пользователь"
    return {"user": {"id": uid, "email": email, "name": name, "role": "Пациент"}, "access_token": access_token}


# -------------------- Auth routes --------------------
@app.post("/auth/register")
async def auth_register(body: RegisterRequest):
    try:
        from supabase_client import auth_signup
        data = await auth_signup(body.email, body.password, body.name)
        user = data.get("user") or {}
        access_token = (data.get("session") or {}).get("access_token") or ""
        if not access_token:
            return JSONResponse(status_code=400, content={"error": "Регистрация прошла, но сессия не получена."})
        return _auth_user_to_response(user, access_token)
    except ValueError as e:
        status, text = _auth_error_response(str(e), is_register=True)
        return JSONResponse(status_code=status, content={"error": text})
    except Exception as e:
        logger.exception("auth_register failed")
        return JSONResponse(status_code=500, content={"error": "Ошибка регистрации."})


@app.post("/auth/login")
async def auth_login(body: LoginRequest):
    try:
        from supabase_client import auth_signin
        data = await auth_signin(body.email, body.password)
        user = data.get("user") or {}
        access_token = data.get("access_token") or ""
        if not access_token:
            return JSONResponse(status_code=401, content={"error": "Неверный email или пароль."})
        return _auth_user_to_response(user, access_token)
    except ValueError as e:
        status, text = _auth_error_response(str(e), is_register=False)
        return JSONResponse(status_code=status, content={"error": text})
    except Exception as e:
        logger.exception("auth_login failed")
        return JSONResponse(status_code=500, content={"error": "Ошибка входа."})


@app.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return _auth_user_to_response(user, "")["user"]


# -------------------- History --------------------
class HistoryItemCreate(BaseModel):
    id: Optional[str] = None
    primaryDiagnosis: str = ""
    icd10Code: str = ""
    confidenceScore: Optional[float] = None
    protocolReference: Optional[str] = None
    differentialDiagnoses: List[dict] = Field(default_factory=list)
    rawProtocolSnippets: Optional[List[str]] = None
    timestamp: Optional[int] = None
    inputPreview: str = ""
    inputText: Optional[str] = None


def _db_row_to_history_item(row: dict) -> dict:
    ts = 0
    if row.get("created_at"):
        try:
            from datetime import datetime
            s = row["created_at"]
            if isinstance(s, str):
                dt = datetime.fromisoformat(s.replace("Z", "+00:00")[:26])
                ts = int(dt.timestamp() * 1000)
        except Exception:
            pass
    return {
        "id": str(row.get("id", "")),
        "primaryDiagnosis": row.get("primary_diagnosis", ""),
        "icd10Code": row.get("icd10_code", ""),
        "confidenceScore": row.get("confidence_score"),
        "protocolReference": row.get("protocol_reference"),
        "differentialDiagnoses": row.get("differential_diagnoses") or [],
        "rawProtocolSnippets": row.get("raw_protocol_snippets"),
        "timestamp": ts,
        "inputPreview": row.get("input_preview", ""),
        "inputText": row.get("input_text"),
    }


@app.get("/history")
async def history_get(user: dict = Depends(get_current_user)):
    try:
        from supabase_client import history_list
        user_id = user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User id missing")
        rows = await history_list(user_id)
        return {"items": [_db_row_to_history_item(r) for r in rows]}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("history_get failed")
        return JSONResponse(status_code=500, content={"error": "Failed to load history"})


@app.post("/history")
async def history_post(body: HistoryItemCreate, user: dict = Depends(get_current_user)):
    try:
        from supabase_client import history_insert
        user_id = user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User id missing")
        item = {
            "primaryDiagnosis": body.primaryDiagnosis,
            "icd10Code": body.icd10Code,
            "confidenceScore": body.confidenceScore,
            "protocolReference": body.protocolReference,
            "differentialDiagnoses": body.differentialDiagnoses or [],
            "rawProtocolSnippets": body.rawProtocolSnippets,
            "inputPreview": (body.inputPreview or "")[:500],
            "inputText": body.inputText,
        }
        row = await history_insert(user_id, item)
        if not row:
            return JSONResponse(status_code=500, content={"error": "Failed to save"})
        return _db_row_to_history_item(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("history_post failed")
        return JSONResponse(status_code=500, content={"error": "Failed to save history"})


@app.delete("/history/{item_id}")
async def history_delete_route(item_id: str, user: dict = Depends(get_current_user)):
    try:
        from supabase_client import history_delete
        user_id = user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User id missing")
        ok = await history_delete(user_id, item_id)
        if not ok:
            return JSONResponse(status_code=404, content={"error": "Not found"})
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("history_delete failed")
        return JSONResponse(status_code=500, content={"error": "Failed to delete"})


@app.delete("/history")
async def history_clear_route(user: dict = Depends(get_current_user)):
    try:
        from supabase_client import history_clear
        user_id = user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User id missing")
        await history_clear(user_id)
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("history_clear failed")
        return JSONResponse(status_code=500, content={"error": "Failed to clear history"})


# -------------------- Health & Diagnose --------------------
@app.get("/health")
async def health():
    llm_ready = state.llm_client is not None or (state.hf_model is not None and state.hf_tokenizer is not None)
    return {"status": "ok", "rag_loaded": state.faiss_index is not None, "llm_backend": LLM_BACKEND, "llm_ready": llm_ready}


@app.get("/diagnose", response_class=HTMLResponse)
async def diagnose_get():
    return """
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>Diagnose API</title></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem;">
    <h1>Diagnose endpoint</h1>
    <p>This URL accepts <strong>POST</strong> only.</p>
    <p>Use the <a href="/">main page</a> or: POST /diagnose with JSON {"symptoms": "..."} or {"query": "..."}</p>
    <p><a href="/">← Back to main page</a></p>
    </body></html>
    """


@app.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(body: DiagnoseRequest, req: Request):
    from diagnosis_engine import run_diagnosis

    query = body.get_query()
    if not query:
        return JSONResponse(status_code=400, content={"error": "Missing symptoms or query field"})

    if not state.faiss_index or not state.faiss_metadata:
        return JSONResponse(
            status_code=503,
            content={"error": "Knowledge base not loaded", "detail": "Run ingest and ensure data/faiss_index/ exists."},
        )
    llm_ready = state.llm_client is not None or (state.hf_model is not None and state.hf_tokenizer is not None)
    if not llm_ready:
        return JSONResponse(
            status_code=503,
            content={"error": "LLM service unavailable", "detail": "Check .env (LLM_BACKEND, LITELLM_API_KEY)."},
        )

    try:
        system_prompt = _load_system_prompt()
        diagnoses_list = await run_diagnosis(query, state, system_prompt)
        out = [DiagnosisItem(**d) for d in diagnoses_list]

        if req:
            auth_header = req.headers.get("Authorization")
            user = await _get_current_user_optional(auth_header)
            if user and out:
                try:
                    from supabase_client import history_insert
                    primary = out[0]
                    item = {
                        "primaryDiagnosis": primary.diagnosis,
                        "icd10Code": primary.icd10_code,
                        "protocolReference": primary.medelement_url,
                        "differentialDiagnoses": [{"diagnosis": d.diagnosis, "icd10Code": d.icd10_code, "reasoning": d.explanation} for d in out[1:]],
                        "rawProtocolSnippets": [d.explanation for d in out],
                        "inputPreview": query[:500] if query else "",
                        "inputText": query,
                    }
                    await history_insert(user["id"], item)
                except Exception as e:
                    logger.warning("Failed to save to history: %s", e)

        return DiagnoseResponse(diagnoses=out)

    except (APIConnectionError, RateLimitError, APIError) as e:
        err_msg = str(e)
        logger.error("LLM API error (503): %s", err_msg)
        return JSONResponse(
            status_code=503,
            content={"error": "LLM service temporarily unavailable", "detail": err_msg},
        )
    except Exception as e:
        logger.exception("Unexpected error in /diagnose")
        return JSONResponse(status_code=500, content={"error": "Internal server error", "detail": str(e)})


# -------------------- Frontend --------------------
if os.path.isdir(FRONTEND_DIST_PATH):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST_PATH, html=True), name="frontend")
    logger.info("Serving frontend from %s", FRONTEND_DIST_PATH)
else:
    logger.info("No frontend/dist — API only. Set FRONTEND_DIST_PATH or add frontend/dist.")


if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8080, reload=False)

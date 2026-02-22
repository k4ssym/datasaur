"""
predict_server.py — FastAPI бэкенд с эндпоинтами /predict и /diagnose.

Пайплайн /predict:
  1. Принимает анамнез пациента (свободный текст).
  2. Шаг 1 (LLM) — Извлечение ключевых симптомов → JSON.
  3. Шаг 2 (RAG)  — Поиск релевантных фрагментов протоколов в FAISS.
  4. Шаг 3 (LLM) — Постановка диагноза на основе анамнеза + протоколов.

/diagnose — совместим с форматом evaluate.py (принимает {symptoms}, возвращает {diagnoses}).
/admin/reload-prompts — горячая перезагрузка промптов из prompts.json (для self_refine).

Запуск:
  uvicorn src.predict_server:app --host 0.0.0.0 --port 8080 --reload

Переменные окружения:
  QAZCODE_BASE_URL   — (по умолч. https://hub.qazcode.ai)
  QAZCODE_API_KEY    — API-ключ
  QAZCODE_MODEL      — Модель (по умолч. oss-120b)
  INDEX_DIR          — Путь к FAISS-индексу (по умолч. ./index)
  PROMPTS_FILE       — Путь к prompts.json (по умолч. ./prompts.json)
  RAG_TOP_K          — Кол-во протоколов из FAISS (по умолч. 4)
  LLM_TIMEOUT        — Таймаут LLM-запроса в сек. (по умолч. 60)
"""

import asyncio
import json
import logging
import os
import re
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))
from rag_query import RAGRetriever


# ════════════════════════════════════════════════════════════════════════════
# КОНФИГУРАЦИЯ
# ════════════════════════════════════════════════════════════════════════════

class Config:
    BASE_URL: str    = os.environ.get("QAZCODE_BASE_URL", "https://hub.qazcode.ai")
    API_KEY: str     = os.environ.get("QAZCODE_API_KEY",  "")
    MODEL: str       = os.environ.get("QAZCODE_MODEL",    "oss-120b")
    INDEX_DIR: str   = os.environ.get("INDEX_DIR",        "./index")
    PROMPTS_FILE: str = os.environ.get("PROMPTS_FILE",    "./prompts.json")
    RAG_TOP_K: int   = int(os.environ.get("RAG_TOP_K",   "6"))
    LLM_TIMEOUT: float = float(os.environ.get("LLM_TIMEOUT", "120.0"))
    MAX_CHUNK_CHARS: int = int(os.environ.get("MAX_CHUNK_CHARS", "3000"))


# ════════════════════════════════════════════════════════════════════════════
# ЛОГГИРОВАНИЕ
# ════════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("predict_server")


# ════════════════════════════════════════════════════════════════════════════
# ИСКЛЮЧЕНИЯ
# ════════════════════════════════════════════════════════════════════════════

class LLMError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code

class RAGError(Exception):
    pass

class SymptomExtractionError(Exception):
    pass


# ════════════════════════════════════════════════════════════════════════════
# ХРАНИЛИЩЕ ПРОМПТОВ (горячая перезагрузка)
# ════════════════════════════════════════════════════════════════════════════

class PromptStore:
    """
    Загружает промпты из prompts.json.
    Поддерживает горячую перезагрузку без рестарта сервера.
    """

    _DEFAULTS = {
        "symptom_extraction_system": (
            "Ты медицинский ассистент. Извлеки из анамнеза ключевые симптомы. "
            'Верни ТОЛЬКО JSON: {"symptoms": [...], "duration": null, "severity": null, "patient_info": null}'
        ),
        "diagnosis_system": (
            "Ты опытный врач. На основе анамнеза и выдержек из протоколов РК, "
            "поставь наиболее вероятный диагноз. Обязательно укажи название и ссылку на протокол РК. "
            "Формат: 1. Диагноз 2. МКБ-10: [код] 3. Протокол РК 4. Источник 5. Обоснование."
        ),
    }

    def __init__(self, prompts_file: str = Config.PROMPTS_FILE):
        self._file = Path(prompts_file)
        self._data: dict[str, str] = {}
        self._version: int = 0
        self.reload()

    def reload(self) -> dict:
        """Перечитывает файл и обновляет промпты. Потокобезопасен."""
        if self._file.exists():
            try:
                with open(self._file, encoding="utf-8") as f:
                    raw = json.load(f)
                self._data = {
                    k: v for k, v in raw.items()
                    if not k.startswith("_") and isinstance(v, str)
                }
                self._version = raw.get("_version", self._version + 1)
                logger.info(
                    "Промпты перезагружены из %s (версия %d)", self._file, self._version
                )
            except Exception as exc:
                logger.error("Ошибка чтения %s: %s. Использую текущие промпты.", self._file, exc)
        else:
            logger.warning("Файл %s не найден, используются промпты по умолчанию.", self._file)
            self._data = dict(self._DEFAULTS)
        return self._data

    @property
    def symptom_extraction_system(self) -> str:
        return self._data.get("symptom_extraction_system", self._DEFAULTS["symptom_extraction_system"])

    @property
    def diagnosis_system(self) -> str:
        return self._data.get("diagnosis_system", self._DEFAULTS["diagnosis_system"])

    @property
    def version(self) -> int:
        return self._version

    def as_dict(self) -> dict:
        return dict(self._data)


# ════════════════════════════════════════════════════════════════════════════
# LLM-КЛИЕНТ
# ════════════════════════════════════════════════════════════════════════════

class QazcodeClient:
    CHAT_ENDPOINT = "/v1/chat/completions"

    def __init__(self):
        self._client = httpx.AsyncClient(
            base_url=Config.BASE_URL,
            headers={
                "Authorization": f"Bearer {Config.API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=httpx.Timeout(Config.LLM_TIMEOUT),
        )

    async def aclose(self):
        await self._client.aclose()

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        request_id: str = "",
    ) -> str:
        payload = {
            "model": Config.MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        log_prefix = f"[{request_id}] " if request_id else ""
        logger.info(
            "%sLLM запрос: модель=%s, сообщений=%d",
            log_prefix, Config.MODEL, len(messages),
        )
        t0 = time.perf_counter()

        try:
            resp = await self._client.post(self.CHAT_ENDPOINT, json=payload)
        except httpx.TimeoutException as exc:
            raise LLMError(f"LLM таймаут ({Config.LLM_TIMEOUT}s)") from exc
        except httpx.RequestError as exc:
            raise LLMError(f"Ошибка соединения с LLM: {exc}") from exc

        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        logger.info("%sLLM ответ: HTTP %d, %dms", log_prefix, resp.status_code, elapsed_ms)

        if resp.status_code != 200:
            raise LLMError(
                f"LLM API вернул HTTP {resp.status_code}: {resp.text[:300]}",
                status_code=resp.status_code,
            )
        try:
            return resp.json()["choices"][0]["message"]["content"]
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise LLMError(f"Невалидный формат ответа LLM: {exc}") from exc


# ════════════════════════════════════════════════════════════════════════════
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ════════════════════════════════════════════════════════════════════════════

def extract_json_from_llm(text: str) -> dict:
    """Извлекает JSON из текста LLM-ответа (обрабатывает markdown-обёртки)."""
    stripped = text.strip()
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", stripped, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    m = re.search(r"\{.*\}", stripped, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
    raise SymptomExtractionError(f"Не удалось извлечь JSON: {text[:300]}")


def symptoms_to_query(symptom_data: dict) -> str:
    parts = []
    for s in (symptom_data.get("symptoms") or []):
        if s:
            parts.append(str(s))
    if symptom_data.get("duration"):
        parts.append(str(symptom_data["duration"]))
    if symptom_data.get("severity"):
        parts.append(str(symptom_data["severity"]))
    return ", ".join(parts) or "симптомы пациента"


def extract_icd_codes_from_text(text: str) -> list[str]:
    """Извлекает коды МКБ-10 из свободного текста."""
    return re.findall(r"\b[A-Z]\d{2}(?:\.\d{1,2})?\b", text)


# Стоп-слова для очистки RAG-запроса
_STOP_WORDS = {
    "здравствуйте", "добрый", "день", "привет", "доброе", "утро", "вечер",
    "пожалуйста", "подскажите", "скажите", "помогите", "спасибо",
    "мне", "меня", "мной", "моя", "мой", "моё", "мою", "моей", "моего",
    "уже", "очень", "просто", "прям", "вообще", "кстати", "наверное",
    "может", "кажется", "думаю", "боюсь", "переживаю", "страшно",
    "нужно", "хочу", "знаю", "понимаю", "могу", "стоит",
    "это", "что", "как", "где", "когда", "если", "или",
    "врач", "больница", "скорая", "лечение",
    "какой", "какая", "какие", "почему", "зачем",
    "ещё", "еще", "тоже", "также", "потом", "теперь",
}


def prepare_rag_query(anamnesis: str) -> str:
    """
    Готовит компактный RAG-запрос из анамнеза пациента.
    MiniLM модель имеет контекст ~128 токенов (~400 символов).
    Длинный текст теряет медицинскую информацию при усечении.
    """
    # Убираем приветствия и вопросы в конце
    text = anamnesis.strip()

    # Разбиваем на предложения
    sentences = re.split(r'[.!?]+', text)
    medical_parts = []
    for s in sentences:
        s = s.strip()
        if not s or len(s) < 10:
            continue
        # Пропускаем вопросы и просьбы
        lower = s.lower()
        if any(lower.startswith(w) for w in [
            "подскажите", "скажите", "помогите", "нужно ли", "можно ли",
            "что делать", "к кому", "это опасно", "это критично",
            "стоит ли", "надо ли",
        ]):
            continue
        if lower.startswith("здравствуйте") or lower.startswith("добрый"):
            # Убираем приветствие но оставляем если есть мед. инфо после
            after = s[s.find(" ", 12):].strip() if len(s) > 15 else ""
            if after:
                s = after
            else:
                continue
        medical_parts.append(s)

    # Собираем до ~400 символов (оптимально для MiniLM-128)
    result = ". ".join(medical_parts)
    if len(result) > 500:
        result = result[:500]

    return result or anamnesis[:400]


def build_protocol_context(rag_results: list[dict]) -> str:
    """Форматирует найденные протоколы для промпта диагностики."""
    blocks = []
    for i, r in enumerate(rag_results, 1):
        icd_str = ", ".join(r["icd_codes"]) if r["icd_codes"] else "—"
        title   = r.get("title") or r.get("source", "Протокол")
        source  = r.get("source", "")
        excerpt = r["text"][: Config.MAX_CHUNK_CHARS].strip()
        if len(r["text"]) > Config.MAX_CHUNK_CHARS:
            excerpt += "..."
        blocks.append(
            f"### Протокол {i}: {title}\n"
            f"Источник: {source}\n"
            f"МКБ-10: {icd_str}\n"
            f"Релевантность: {r['score']:.2f}\n\n{excerpt}"
        )
    return "\n\n---\n\n".join(blocks) if blocks else "(протоколы не найдены)"


# ════════════════════════════════════════════════════════════════════════════
# СХЕМЫ
# ════════════════════════════════════════════════════════════════════════════

class PredictRequest(BaseModel):
    anamnesis: str = Field(..., min_length=5, max_length=10_000)
    top_k: int     = Field(default=4, ge=1, le=10)

class DiagnoseRequest(BaseModel):
    """Формат совместимый с evaluate.py."""
    symptoms: str = Field(..., description="Текст анамнеза/симптомов пациента")
    top_k: int    = Field(default=3, ge=1, le=10)

class ProtocolRef(BaseModel):
    title: str
    source: str
    icd_codes: list[str]
    relevance_score: float

class ExtractedSymptoms(BaseModel):
    symptoms: list[str]
    duration:     str | None = None
    severity:     str | None = None
    patient_info: str | None = None

class Timing(BaseModel):
    symptom_extraction_ms: int
    rag_search_ms:         int
    diagnosis_ms:          int
    total_ms:              int

class PredictResponse(BaseModel):
    diagnosis:          str
    extracted_symptoms: ExtractedSymptoms
    protocols_used:     list[ProtocolRef]
    timing:             Timing

# evaluate.py-совместимый формат
class DiagnosisItem(BaseModel):
    rank:        int
    diagnosis:   str
    icd10_code:  str
    explanation: str

class DiagnoseResponse(BaseModel):
    diagnoses: list[DiagnosisItem]


# ════════════════════════════════════════════════════════════════════════════
# ГЛОБАЛЬНЫЕ ОБЪЕКТЫ И LIFESPAN
# ════════════════════════════════════════════════════════════════════════════

retriever:    RAGRetriever | None = None
llm_client:   QazcodeClient | None = None
prompt_store: PromptStore | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global retriever, llm_client, prompt_store

    prompt_store = PromptStore(Config.PROMPTS_FILE)
    llm_client   = QazcodeClient()
    logger.info("LLM-клиент готов (модель=%s)", Config.MODEL)

    try:
        retriever = await asyncio.to_thread(RAGRetriever, Config.INDEX_DIR)
        logger.info(
            "FAISS-индекс: %d векторов, модель=%s",
            retriever.index.ntotal, retriever.model_name,
        )
    except FileNotFoundError as exc:
        logger.warning("FAISS-индекс не найден: %s", exc)

    yield

    if llm_client:
        await llm_client.aclose()
    logger.info("Сервер остановлен.")


app = FastAPI(
    title="QazCode Clinical RAG API",
    version="2.1.0",
    lifespan=lifespan,
)


# ════════════════════════════════════════════════════════════════════════════
# ОБРАБОТЧИКИ ОШИБОК
# ════════════════════════════════════════════════════════════════════════════

@app.exception_handler(LLMError)
async def _llm_err(request: Request, exc: LLMError):
    logger.error("LLMError: %s", exc)
    return JSONResponse(
        status_code=exc.status_code or 502,
        content={"error": "llm_error", "detail": str(exc)},
    )

@app.exception_handler(RAGError)
async def _rag_err(request: Request, exc: RAGError):
    logger.error("RAGError: %s", exc)
    return JSONResponse(
        status_code=503,
        content={"error": "rag_error", "detail": str(exc)},
    )


# ════════════════════════════════════════════════════════════════════════════
# ОБЩАЯ ЛОГИКА ПАЙПЛАЙНА
# ════════════════════════════════════════════════════════════════════════════

async def _run_pipeline(
    anamnesis: str,
    top_k: int,
    request_id: str = "",
    skip_symptom_extraction: bool = False,
) -> tuple[str, dict, list[dict], dict]:
    """
    Выполняет полный RAG-пайплайн и возвращает:
      (diagnosis_text, symptom_data, rag_results, timing)
    """
    total_start = time.perf_counter()

    symptom_extraction_ms = 0
    symptom_data = {"symptoms": [], "duration": None, "severity": None}

    if not skip_symptom_extraction:
        # ── Шаг 1: извлечение симптомов (только для /predict) ────────────
        t1 = time.perf_counter()
        symptom_raw = await llm_client.chat(
            messages=[
                {"role": "system", "content": prompt_store.symptom_extraction_system},
                {"role": "user",   "content": f"Анамнез пациента:\n\n{anamnesis}"},
            ],
            temperature=0.1,
            max_tokens=512,
            request_id=request_id,
        )
        symptom_extraction_ms = int((time.perf_counter() - t1) * 1000)

        try:
            symptom_data = extract_json_from_llm(symptom_raw)
        except SymptomExtractionError:
            logger.warning("[%s] Fallback: не удалось распарсить симптомы", request_id)
            symptom_data = {"symptoms": [anamnesis[:300]], "duration": None, "severity": None}

    # ── Шаг 2: RAG-поиск ─────────────────────────────────────────────────
    rag_results: list[dict] = []
    rag_search_ms = 0

    if retriever is not None:
        search_query = prepare_rag_query(anamnesis)
        logger.info("[%s] RAG запрос (%d симв.): %s...", request_id, len(search_query), search_query[:80])

        t2 = time.perf_counter()
        rag_results = await asyncio.to_thread(
            retriever.search_for_diagnosis, search_query, top_k
        )
        rag_search_ms = int((time.perf_counter() - t2) * 1000)
        logger.info("[%s] RAG: %d протоколов за %dms", request_id, len(rag_results), rag_search_ms)

    # ── Шаг 3: постановка диагноза (LLM с собственными знаниями + RAG контекст) ──
    t3 = time.perf_counter()

    # Формируем контекст из RAG-протоколов (если есть)
    protocol_section = ""
    if rag_results:
        protocol_section = (
            f"\n\n## Справочная информация из клинических протоколов РК\n\n"
            f"{build_protocol_context(rag_results)}\n"
        )

    user_msg = (
        f"## Анамнез пациента\n\n{anamnesis}\n"
        f"{protocol_section}\n"
        f"## Задание\n\n"
        f"Поставь ОДИН наиболее вероятный диагноз по МКБ-10.\n"
        f"Ответ СТРОГО в формате:\n"
        f"1. Диагноз: [полное название болезни]\n"
        f"2. МКБ-10: [ОДИН конкретный код, максимально специфичный, например J18.0 а не J18]\n"
        f"3. Обоснование: [2-3 предложения]"
    )
    diagnosis_text = await llm_client.chat(
        messages=[
            {"role": "system", "content": prompt_store.diagnosis_system},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0.1,
        max_tokens=1024,
        request_id=request_id,
    )
    diagnosis_ms = int((time.perf_counter() - t3) * 1000)
    total_ms     = int((time.perf_counter() - total_start) * 1000)

    logger.info("[%s] Диагноз готов за %dms (total=%dms)", request_id, diagnosis_ms, total_ms)

    timing = {
        "symptom_extraction_ms": symptom_extraction_ms,
        "rag_search_ms":         rag_search_ms,
        "diagnosis_ms":          diagnosis_ms,
        "total_ms":              total_ms,
    }
    return diagnosis_text, symptom_data, rag_results, timing


# ════════════════════════════════════════════════════════════════════════════
# ЭНДПОИНТЫ
# ════════════════════════════════════════════════════════════════════════════

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest) -> PredictResponse:
    """Полный RAG-пайплайн, богатый структурированный ответ."""
    rid = f"req-{int(time.perf_counter() * 1000) % 1_000_000:06d}"
    logger.info("[%s] POST /predict | %d симв.", rid, len(request.anamnesis))

    diagnosis_text, symptom_data, rag_results, timing = await _run_pipeline(
        request.anamnesis, request.top_k, rid
    )

    return PredictResponse(
        diagnosis=diagnosis_text,
        extracted_symptoms=ExtractedSymptoms(
            symptoms=symptom_data.get("symptoms") or [],
            duration=symptom_data.get("duration"),
            severity=symptom_data.get("severity"),
            patient_info=symptom_data.get("patient_info"),
        ),
        protocols_used=[
            ProtocolRef(
                title=r.get("title") or r["source"],
                source=r["source"],
                icd_codes=r["icd_codes"],
                relevance_score=round(r["score"], 4),
            )
            for r in rag_results
        ],
        timing=Timing(**timing),
    )


@app.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(request: DiagnoseRequest) -> DiagnoseResponse:
    """
    Формат совместимый с evaluate.py.
    Принимает {symptoms}, возвращает {diagnoses: [{rank, diagnosis, icd10_code, explanation}]}.
    """
    rid = f"req-{int(time.perf_counter() * 1000) % 1_000_000:06d}"
    logger.info("[%s] POST /diagnose | %d симв.", rid, len(request.symptoms))

    if not request.symptoms.strip():
        raise HTTPException(status_code=400, detail="'symptoms' не может быть пустым")

    diagnosis_text, symptom_data, rag_results, _ = await _run_pipeline(
        request.symptoms, request.top_k, rid, skip_symptom_extraction=True
    )

    # Формируем список диагнозов из протоколов + ICD-кодов из текста
    diagnoses: list[DiagnosisItem] = []
    seen_codes: set[str] = set()

    # Сначала — ICD-коды из текста диагноза (наиболее уверенные)
    text_icds = extract_icd_codes_from_text(diagnosis_text)

    # Затем — из протоколов FAISS
    protocol_icds: list[tuple[str, str, str]] = []  # (icd, title, source)
    for r in rag_results:
        title  = r.get("title") or r["source"]
        source = r["source"]
        for code in r["icd_codes"]:
            protocol_icds.append((code, title, source))

    # Приоритет: ICD из текста диагноза LLM всегда первые
    ordered_icds: list[tuple[str, str, str]] = []
    for code in text_icds:
        if code not in seen_codes:
            matched = next((p for p in protocol_icds if p[0] == code), None)
            ordered_icds.append(matched or (code, "Из диагноза", "—"))
            seen_codes.add(code)
    # Затем — из протоколов FAISS (которых не было в тексте)
    for item in protocol_icds:
        if item[0] not in seen_codes:
            ordered_icds.append(item)
            seen_codes.add(item[0])

    # Формируем топ-N записей
    snippet = diagnosis_text[:400].replace("\n", " ")
    for rank, (icd_code, title, source) in enumerate(ordered_icds[:request.top_k], 1):
        diagnoses.append(DiagnosisItem(
            rank=rank,
            diagnosis=title,
            icd10_code=icd_code,
            explanation=f"{snippet}..." if len(diagnosis_text) > 400 else snippet,
        ))

    # Если список пуст — fallback с заглушкой
    if not diagnoses:
        diagnoses.append(DiagnosisItem(
            rank=1,
            diagnosis="Диагноз не определён",
            icd10_code="Z99.9",
            explanation=diagnosis_text[:400],
        ))

    return DiagnoseResponse(diagnoses=diagnoses)


@app.post("/admin/reload-prompts")
async def reload_prompts():
    """Горячая перезагрузка промптов из prompts.json (используется self_refine.py)."""
    updated = await asyncio.to_thread(prompt_store.reload)
    logger.info("Промпты перезагружены через /admin/reload-prompts")
    return {
        "status": "reloaded",
        "version": prompt_store.version,
        "keys": list(updated.keys()),
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "llm": {"model": Config.MODEL, "base_url": Config.BASE_URL},
        "rag": {
            "loaded": retriever is not None,
            "total_vectors": retriever.index.ntotal if retriever else 0,
        },
        "prompts": {
            "version": prompt_store.version if prompt_store else None,
            "file": Config.PROMPTS_FILE,
        },
    }


# ════════════════════════════════════════════════════════════════════════════
# РАЗДАЧА СТАТИКИ NEXT.JS (последний маршрут — после всех API-эндпоинтов)
# ════════════════════════════════════════════════════════════════════════════
# Директория создаётся во время Docker-сборки:
#   COPY --from=frontend-builder /build/frontend/out ./frontend/out
# В режиме разработки (без Docker) этот блок просто не активируется.

def _mount_frontend(application: FastAPI) -> None:
    """
    Монтирует Next.js static export.
    Вызывается ПОСЛЕ регистрации всех API-маршрутов, поэтому
    catch-all /{path} не перекрывает /predict, /diagnose, /health.
    """
    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles

    static_dir = ROOT / "frontend" / "out"
    if not static_dir.exists():
        logger.info(
            "Директория Next.js static export не найдена (%s) — "
            "API-only режим. В Docker static будет доступен.",
            static_dir,
        )
        return

    # ── Статические ассеты Next.js (_next/static/…) ───────────────────
    next_dir = static_dir / "_next"
    if next_dir.exists():
        application.mount(
            "/_next",
            StaticFiles(directory=str(next_dir)),
            name="_next_assets",
        )

    # ── SPA catch-all ─────────────────────────────────────────────────
    # Порядок матчинга FastAPI: сначала явные маршруты, затем этот catch-all.
    @application.get("/{full_path:path}", include_in_schema=False)
    async def _serve_spa(full_path: str) -> FileResponse:
        # 1. Точное совпадение файла (favicon.ico, robots.txt, …)
        candidate = static_dir / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))

        # 2. Попытка найти <path>.html (Next.js trailingSlash)
        html_candidate = static_dir / f"{full_path.rstrip('/')}.html"
        if html_candidate.is_file():
            return FileResponse(str(html_candidate))

        # 3. SPA fallback → index.html
        index = static_dir / "index.html"
        if index.is_file():
            return FileResponse(str(index))

        raise HTTPException(status_code=404, detail="Not found")

    logger.info("Next.js static export смонтирован из %s", static_dir)


_mount_frontend(app)

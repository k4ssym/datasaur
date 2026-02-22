"""
diagnose_server.py — FastAPI сервер диагностики с RAG.

Принимает симптомы пациента, ищет релевантные клинические протоколы
в FAISS-индексе и возвращает топ-N диагнозов с ICD-10 кодами.

Запуск:
    uvicorn src.diagnose_server:app --host 0.0.0.0 --port 8080

Тест:
    curl -X POST http://localhost:8080/diagnose \
         -H "Content-Type: application/json" \
         -d '{"symptoms": "кашель, температура 38.5, одышка, слабость"}'
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Добавляем корень проекта в sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))
from rag_query import RAGRetriever

INDEX_DIR = os.environ.get("INDEX_DIR", "./index")

# ─── Глобальный retriever (загружается один раз при старте) ─────────────────
retriever: RAGRetriever | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global retriever
    try:
        retriever = RAGRetriever(INDEX_DIR)
        print("[server] RAG retriever готов")
    except FileNotFoundError as e:
        print(f"[server] ПРЕДУПРЕЖДЕНИЕ: {e}")
        print("[server] Сервер запущен без RAG-индекса. Сначала запустите build_index.py")
    yield


app = FastAPI(
    title="QazCode Clinical Diagnosis API",
    description="RAG-based diagnosis using Kazakhstan clinical protocols",
    version="1.0.0",
    lifespan=lifespan,
)


# ─── Схемы запроса/ответа ───────────────────────────────────────────────────

class DiagnoseRequest(BaseModel):
    symptoms: str
    top_k: int = 3


class DiagnosisResult(BaseModel):
    rank: int
    icd_code: str
    description: str
    explanation: str
    confidence: float


class DiagnoseResponse(BaseModel):
    diagnoses: list[DiagnosisResult]


# ─── Endpoint ───────────────────────────────────────────────────────────────

@app.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(request: DiagnoseRequest) -> DiagnoseResponse:
    """
    Принимает симптомы пациента, возвращает топ-N вероятных диагнозов.
    """
    if not request.symptoms.strip():
        raise HTTPException(status_code=400, detail="Поле 'symptoms' не может быть пустым")

    if retriever is None:
        raise HTTPException(
            status_code=503,
            detail="RAG-индекс не загружен. Запустите build_index.py и перезапустите сервер.",
        )

    results = retriever.search_for_diagnosis(
        symptoms=request.symptoms,
        top_k=request.top_k,
    )

    diagnoses = []
    for r in results:
        # Берём первый ICD-код протокола как основной
        icd_codes = r.get("icd_codes") or []
        primary_icd = icd_codes[0] if icd_codes else "Z99.9"

        # Формируем объяснение из найденного чанка
        snippet = r["text"][:300].strip().replace("\n", " ")
        explanation = f"{snippet}..." if len(r["text"]) > 300 else snippet

        diagnoses.append(
            DiagnosisResult(
                rank=r["rank"],
                icd_code=primary_icd,
                description=r["title"] or r["source"],
                explanation=explanation,
                confidence=round(r["score"], 4),
            )
        )

    return DiagnoseResponse(diagnoses=diagnoses)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "index_loaded": retriever is not None,
        "total_vectors": retriever.index.ntotal if retriever else 0,
    }

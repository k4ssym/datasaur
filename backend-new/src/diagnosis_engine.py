"""
Diagnosis engine: RAG (FAISS) + LLM → list of diagnoses.

REPLACE THIS MODULE when you plug in your friend's high-accuracy model.
Keep the same interface:

  async def run_diagnosis(query: str, state: DiagnosisEngineState, system_prompt: str) -> list[dict]

Each returned dict must have: rank, icd10_code, diagnosis, explanation, protocol_id, medelement_url.
"""

import json
import logging
from typing import Any, List, Protocol

from langchain_core.documents import Document
from openai import APIError, APIConnectionError, RateLimitError

logger = logging.getLogger(__name__)


class DiagnosisEngineState(Protocol):
    """State required by run_diagnosis (avoids circular import from main)."""
    faiss_index: Any
    faiss_metadata: Any
    embeddings: Any
    llm_client: Any
    model_id: str
    hf_model: Any
    hf_tokenizer: Any


def _medelement_url(icd10_code: str) -> str:
    from urllib.parse import urlencode
    code = (icd10_code or "").strip()
    if not code or code == "Unknown":
        return ""
    return "https://diseases.medelement.com/?" + urlencode({
        "searched_data": "diseases",
        "q": code,
        "diseases_filter_type": "list",
        "diseases_content_type": "4",
    })


def _generate_hf(model, tokenizer, system_prompt: str, user_prompt: str, max_new_tokens: int = 800) -> str:
    """Sync HF generation (run in thread)."""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )
    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    out = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        do_sample=True,
        temperature=0.1,
        pad_token_id=tokenizer.eos_token_id,
    )
    response = tokenizer.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
    return response.strip() or "{}"


async def run_diagnosis(
    query: str,
    state: DiagnosisEngineState,
    system_prompt: str,
) -> List[dict]:
    """
    Run RAG + LLM and return list of diagnosis dicts.
    Each dict: rank, icd10_code, diagnosis, explanation, protocol_id.
    Raises: APIConnectionError, RateLimitError, APIError on LLM failure.
    """
    import faiss
    import numpy as np

    query_vec = state.embeddings.embed_query(query)
    vec = np.array([query_vec], dtype=np.float32)
    faiss.normalize_L2(vec)
    k = min(5, state.faiss_index.ntotal)
    distances, indices = state.faiss_index.search(vec, k)
    docs: List[Document] = []
    for idx in indices[0]:
        if idx < 0:
            continue
        meta = state.faiss_metadata[idx]
        docs.append(Document(
            page_content=meta.get("text", ""),
            metadata={"protocol_id": meta.get("protocol_id", ""), "icd_codes": meta.get("icd_codes", [])},
        ))
    if not docs:
        context = "Нет подходящих протоколов."
    else:
        context_parts = [f"[Чанк {i+1}]\n{doc.page_content}" for i, doc in enumerate(docs)]
        context = "\n\n---\n\n".join(context_parts)

    logger.info("Retrieved %s chunks", len(docs))
    logger.info("QUERY: %s", query[:300] + ("..." if len(query) > 300 else ""))
    user_prompt = f"ЖАЛОБЫ ПАЦИЕНТА:\n{query}\n\nНАЙДЕННЫЕ ПРОТОКОЛЫ:\n{context}"

    if state.llm_client is not None:
        response = await state.llm_client.chat.completions.create(
            model=state.model_id,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=1500,
        )
        raw = response.choices[0].message.content
    else:
        import asyncio
        raw = await asyncio.to_thread(
            _generate_hf,
            state.hf_model,
            state.hf_tokenizer,
            system_prompt,
            user_prompt,
        )

    if not raw:
        raw = "{}"
    logger.info("RAW LLM RESPONSE: %s", raw[:800] + ("..." if len(raw) > 800 else ""))

    data: dict = {}
    try:
        if not raw or "{" not in raw:
            data = {"diagnoses": []}
        else:
            start = raw.index("{")
            end = raw.rindex("}") + 1
            data = json.loads(raw[start:end])
    except (ValueError, json.JSONDecodeError):
        try:
            data = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            data = {}
    if not isinstance(data, dict):
        data = {}

    raw_diagnoses = data.get("diagnoses", [])
    if not raw_diagnoses and isinstance(data, dict) and ("icd10_code" in data or "code" in data or "icd_code" in data):
        raw_diagnoses = [data]
    if not isinstance(raw_diagnoses, list):
        raw_diagnoses = []

    out = []
    for rank, item in enumerate(raw_diagnoses[:3], start=1):
        if not isinstance(item, dict):
            continue
        code = (
            item.get("icd10_code")
            or item.get("code")
            or item.get("icd_code")
            or item.get("diagnosis_code")
        )
        if not code or not str(code).strip():
            continue
        code = str(code).strip()
        name = item.get("name") or item.get("diagnosis") or "Неизвестно"
        expl = item.get("explanation") or item.get("reasoning") or ""
        pid = item.get("protocol_id") or item.get("protocol") or "Unknown"
        out.append({
            "rank": rank,
            "icd10_code": code,
            "diagnosis": name,
            "explanation": expl,
            "protocol_id": pid,
            "medelement_url": _medelement_url(code),
        })
    return out

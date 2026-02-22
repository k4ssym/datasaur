"""
FAISS index from protocols_corpus.jsonl with enriched chunks (ID, title, ОФИЦИАЛЬНЫЕ КОДЫ МКБ-10).
Run from backend-new: py src/ingest.py  or  uv run python src/ingest.py
Output: data/faiss_index/index.faiss + metadata.json
"""
import json
import re
import logging
from pathlib import Path

import faiss
import numpy as np
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CORPUS_PATH = PROJECT_ROOT / "data" / "protocols_corpus.jsonl"
FAISS_INDEX_DIR = PROJECT_ROOT / "data" / "faiss_index"
FAISS_INDEX_PATH = FAISS_INDEX_DIR / "index.faiss"
METADATA_PATH = FAISS_INDEX_DIR / "metadata.json"

ICD10_CANONICAL = re.compile(r"^[A-Z]\d{2}(?:\.\d+)?$")
ICD10_IN_TEXT = re.compile(r"[A-Za-zА-Яа-яЁё]\s*\d{2}(?:\s*\.\s*\d+)?", re.IGNORECASE)
TRANSLIT = str.maketrans("АВЕКМНОРСТУХабекмнопрстух", "ABEKMHOPCTYXabekmnoprstux")


def normalize_icd(raw: str) -> str | None:
    if not raw or not isinstance(raw, str):
        return None
    s = raw.strip().replace(" ", "").replace("\u00a0", "")
    if len(s) < 3:
        return None
    s = s.translate(TRANSLIT)
    if not s:
        return None
    s = s[0].upper() + (s[1:] if len(s) > 1 else "")
    return s if ICD10_CANONICAL.match(s) else None


def clean_icd_codes(raw_codes, text):
    valid = set()
    if isinstance(raw_codes, list):
        for code in raw_codes:
            c = normalize_icd(str(code).strip()) if code is not None else None
            if c:
                valid.add(c)
    text = text or ""
    for m in ICD10_IN_TEXT.findall(text):
        c = normalize_icd(m)
        if c:
            valid.add(c)
    return sorted(valid)


def main():
    FAISS_INDEX_DIR.mkdir(parents=True, exist_ok=True)
    if not CORPUS_PATH.exists():
        raise FileNotFoundError(f"Corpus not found: {CORPUS_PATH}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=900, chunk_overlap=220, length_function=len, separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks_meta = []
    skipped = 0
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                skipped += 1
                continue
            protocol_id = str(data.get("protocol_id") or "").strip()
            title = str(data.get("title") or "").strip()
            full_text = str(data.get("text") or "")
            raw_icd = data.get("icd_codes") or []
            final_codes = clean_icd_codes(raw_icd, full_text)
            codes_str = ", ".join(final_codes) if final_codes else "Коды не указаны"
            for chunk_text in splitter.split_text(full_text):
                if not chunk_text or not chunk_text.strip():
                    continue
                enriched = (
                    f"ID ПРОТОКОЛА: {protocol_id}\n"
                    f"НАЗВАНИЕ: {title}\n"
                    f"ОФИЦИАЛЬНЫЕ КОДЫ МКБ-10: {codes_str}\n---\n{chunk_text}"
                )
                chunks_meta.append({"text": enriched, "protocol_id": protocol_id, "icd_codes": final_codes})

    if not chunks_meta:
        raise RuntimeError("No chunks produced from corpus.")
    if skipped:
        logger.warning("Skipped %s bad lines", skipped)

    logger.info("Chunks: %s. Loading embedding model...", len(chunks_meta))
    embeddings = HuggingFaceEmbeddings(model_name="cointegrated/rubert-tiny2")
    batch_size = 128
    all_vectors = []
    for start in range(0, len(chunks_meta), batch_size):
        batch = chunks_meta[start : start + batch_size]
        vecs = embeddings.embed_documents([c["text"] for c in batch])
        all_vectors.extend(vecs)
        logger.info("Embedded %s / %s", min(start + batch_size, len(chunks_meta)), len(chunks_meta))

    arr = np.array(all_vectors, dtype=np.float32)
    faiss.normalize_L2(arr)
    index = faiss.IndexFlatIP(arr.shape[1])
    index.add(arr)
    FAISS_INDEX_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(FAISS_INDEX_PATH))
    metadata = [{"text": c["text"], "protocol_id": c["protocol_id"], "icd_codes": c["icd_codes"]} for c in chunks_meta]
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=0)
    logger.info("Done. Index: %s (%s vectors). Metadata: %s", FAISS_INDEX_PATH, len(chunks_meta), METADATA_PATH)


if __name__ == "__main__":
    main()

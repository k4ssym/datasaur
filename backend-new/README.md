# backend-new

Unified backend: FastAPI app with auth (Supabase), per-user history, diagnosis API, and frontend static serving.  
Diagnosis is delegated to **`src/diagnosis_engine.py`** so you can swap in your friend's high-accuracy model without touching the rest.

## Structure

- `src/main.py` — FastAPI app: health, auth, history, POST /diagnose, frontend mount
- `src/diagnosis_engine.py` — **Replace this** with your friend's model; interface: `run_diagnosis(query, state, system_prompt) -> list[dict]`
- `src/supabase_client.py` — Auth + analysis_history (Supabase)
- `src/ingest.py` — Build FAISS index from protocols_corpus.jsonl
- `evaluate.py` — Accuracy@1 / Recall@3 evaluation script

## Run

See **RUN_LOCAL.md**. Summary: `.env` → `uv sync` → (ingest if needed) → `uv run uvicorn src.main:app --host 127.0.0.1 --port 8080` → in another terminal run `evaluate.py`.

## Replacing the model

Replace the contents of `src/diagnosis_engine.py` with your friend's implementation. Keep the function signature:

```python
async def run_diagnosis(query: str, state: DiagnosisEngineState, system_prompt: str) -> list[dict]
```

Each returned dict: `rank`, `icd10_code`, `diagnosis`, `explanation`, `protocol_id`, `medelement_url`.

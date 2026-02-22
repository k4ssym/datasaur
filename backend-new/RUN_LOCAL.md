# backend-new — Run & test

This is the **single backend** after merging my-project + your friend's model.  
Auth, history, frontend serving, and evaluation scripts are here.  
**Diagnosis logic** lives in `src/diagnosis_engine.py` — replace that module to plug in a different model.

---

## Quick start

1. **Copy env**
   ```bash
   copy .env.example .env
   ```
   Edit `.env`: set `LITELLM_API_KEY`, and Supabase keys if you use auth/history.

2. **Dependencies**
   ```bash
   uv sync
   # or: pip install -e .
   ```

3. **FAISS index**  
   Before deleting my-project, copy into backend-new if you want to avoid re-running ingest:
   - `data/faiss_index/` (index.faiss + metadata.json)
   - `data/protocols_corpus.jsonl` (for re-ingest)
   - `data/test_set/` (full 221 files for evaluation)  
   Or run ingest here (needs `data/protocols_corpus.jsonl`):
   ```bash
   uv run python src/ingest.py
   ```

4. **Start server**
   ```bash
   uv run uvicorn src.main:app --host 127.0.0.1 --port 8080 --reload
   ```

5. **Frontend**  
   Build from repo root: `cd ../frontend && npm run build`.  
   Backend-new serves from `../frontend/dist` or `backend-new/frontend/dist` if present.

6. **Evaluation**
   ```bash
   uv run python evaluate.py -e http://127.0.0.1:8080/diagnose -d ./data/test_set -n MyTeam -p 3
   ```
   Quick test on 5 files: use `-d ./data/test_mini` or add `-l 10`.

---

## Plugging in your friend's model

- **Replace only** `src/diagnosis_engine.py`.
- Keep the same interface:
  ```python
  async def run_diagnosis(query: str, state: DiagnosisEngineState, system_prompt: str) -> list[dict]
  ```
  Each dict must have: `rank`, `icd10_code`, `diagnosis`, `explanation`, `protocol_id`, `medelement_url`.
- Your friend’s RAG/model can live in the same module or in a submodule that `diagnosis_engine` calls.

---

## Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Status, rag_loaded, llm_ready |
| `/diagnose` | GET | HTML hint (use POST) |
| `/diagnose` | POST | Body: `{"symptoms":"..."}` or `{"query":"..."}` → diagnoses |
| `/auth/register` | POST | Supabase signup |
| `/auth/login` | POST | Supabase signin |
| `/auth/me` | GET | Current user (Bearer) |
| `/history` | GET/POST/DELETE | Per-user analysis history |

---

## Data layout

- `data/faiss_index/` — index.faiss + metadata.json (from ingest)
- `data/protocols_corpus.jsonl` — source for ingest (copy from my-project if needed)
- `data/test_set/` — full eval set
- `data/test_mini/` — 5 files for quick test
- `data/evals/` — evaluate.py output (JSONL + metrics JSON)

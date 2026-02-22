# ════════════════════════════════════════════════════════════════════════════
# КлинДиагноз — Multi-stage Dockerfile (fully self-contained)
#
# Стадии:
#   1. frontend-deps   — установка npm-зависимостей (кэш-слой)
#   2. frontend-build  — сборка Next.js static export (out/)
#   3. runtime         — Python 3.12 + uv + FastAPI + модель + индекс
#
# Всё запекается внутрь образа:
#   - sentence-transformers модель (~500 MB)
#   - FAISS-индекс (108k векторов, ~255 MB)
#   - Next.js статика
#
# Запуск: docker compose up --build
# Порт:   8080
# ════════════════════════════════════════════════════════════════════════════


# ──────────────────────────────────────────────────────────────────────────
# Stage 1: Установка npm-зависимостей (отдельный слой для кэша)
# ──────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-deps

WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit --no-fund


# ──────────────────────────────────────────────────────────────────────────
# Stage 2: Сборка Next.js в режиме static export
# ──────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /build/frontend

COPY --from=frontend-deps /build/frontend/node_modules ./node_modules
COPY frontend/ .

# Удаляем proxy API-route — в Docker не нужен
RUN rm -rf src/app/api

ENV NEXT_STATIC_EXPORT=true \
    NEXT_PUBLIC_API_BASE=""

RUN npm run build


# ──────────────────────────────────────────────────────────────────────────
# Stage 3: Python runtime (полностью автономный)
# ──────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# ── Системные зависимости ─────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# ── uv — быстрый Python package manager ──────────────────────────────────
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# ── Переменные окружения ──────────────────────────────────────────────────
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_SYSTEM_PYTHON=1 \
    UV_NO_CACHE=1 \
    # Модель и индекс запечены в образ — кэш внутри контейнера
    HF_HOME=/app/.cache/huggingface \
    INDEX_DIR=/app/index \
    PROMPTS_FILE=/app/prompts.json \
    # API (переопределяется через docker-compose env или -e)
    QAZCODE_BASE_URL=https://hub.qazcode.ai \
    QAZCODE_MODEL=oss-120b

WORKDIR /app

# ── Python зависимости ────────────────────────────────────────────────────
COPY pyproject.toml uv.lock* requirements.txt ./

RUN uv sync --frozen --no-dev 2>/dev/null \
    || { echo "[uv sync skipped — falling back to pip]" \
         && uv pip install -r requirements.txt; }

RUN uv pip install -r requirements.txt

# ── Код приложения ────────────────────────────────────────────────────────
COPY src/           ./src/
COPY rag_query.py   build_index.py  self_refine.py  ./
COPY prompts.json   ./

# ── Модель эмбеддингов — запекаем в образ (без внешних сервисов при старте) ─
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
print('Downloading paraphrase-multilingual-MiniLM-L12-v2 ...'); \
SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2'); \
print('Model cached at', '${HF_HOME}')"

# ── FAISS-индекс — скачиваем готовый из GitHub Releases и запекаем ────────
# Индекс собран из 1137 клинических протоколов РК (108 022 векторов)
ARG INDEX_URL=https://github.com/alnurkengesbay/zhanar/releases/download/v1.0/index.tar.gz
RUN echo "Downloading pre-built FAISS index..." && \
    curl -L "${INDEX_URL}" -o /tmp/index.tar.gz && \
    tar -xzf /tmp/index.tar.gz -C /app && \
    rm /tmp/index.tar.gz && \
    echo "Index ready: $(ls /app/index/)"

# ── Статика Next.js из stage 2 ────────────────────────────────────────────
COPY --from=frontend-build /build/frontend/out ./frontend/out

# ── Метаданные ────────────────────────────────────────────────────────────
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["uv", "run", "uvicorn", "src.predict_server:app", \
     "--host", "0.0.0.0", "--port", "8080", \
     "--workers", "1", "--log-level", "info"]

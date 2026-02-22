# Развёртывание КлинДиагноз на другой платформе

## Что внутри архива

```
clindiag/
├── src/predict_server.py    # FastAPI бэкенд (API /predict, /diagnose)
├── rag_query.py             # RAG-поиск по FAISS-индексу
├── build_index.py           # Построение индекса из corpus.zip
├── prompts.json             # Промпты для LLM
├── index/                   # FAISS-индекс (готовый, ~254 MB)
│   ├── protocols.faiss      # Векторный индекс (108k векторов)
│   └── metadata.pkl         # Метаданные + тексты чанков
├── corpus.zip               # Исходные протоколы (1137 шт.)
├── frontend/                # Next.js интерфейс
├── Dockerfile               # Multi-stage Docker сборка
├── docker-compose.yml       # Запуск одной командой
├── requirements.txt         # Python зависимости
└── .env.example             # Шаблон переменных окружения
```

## Вариант 1: Docker (рекомендуется)

```bash
# 1. Распакуй архив
unzip clindiag_deploy_YYYYMMDD.zip
cd clindiag

# 2. Настрой API-ключ
cp .env.example .env
# Открой .env и впиши свой QAZCODE_API_KEY

# 3. Запусти
docker compose up --build

# 4. Открой в браузере
# http://localhost:8080
```

Первая сборка ~10-15 мин (скачивает Python-пакеты + модель эмбеддингов ~500 MB).
После сборки образ полностью автономен.

## Вариант 2: Без Docker (Python напрямую)

Требования: Python 3.12+

```bash
# 1. Распакуй и перейди в папку
cd clindiag

# 2. Установи зависимости
pip install -r requirements.txt

# 3. Настрой .env
cp .env.example .env
# Впиши QAZCODE_API_KEY

# 4. (Если нет папки index/) Построй индекс
python build_index.py --source corpus.zip

# 5. Запусти сервер
uvicorn src.predict_server:app --host 0.0.0.0 --port 8080
```

## Компоненты системы

| Компонент | Что это | Откуда берётся |
|-----------|---------|----------------|
| **FAISS-индекс** | Векторная база 1137 протоколов РК | Папка `index/` в архиве |
| **Модель эмбеддингов** | `paraphrase-multilingual-MiniLM-L12-v2` (~500 MB) | Скачивается автоматически с HuggingFace |
| **LLM** | `oss-120b` через API Qazcode | Внешний API, нужен ключ в `.env` |

## API

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/predict` | Полный ответ: симптомы + протоколы + диагноз |
| POST | `/diagnose` | `{symptoms}` → `{diagnoses: [{icd10_code}]}` |
| GET | `/health` | Статус сервера |

### Пример запроса

```bash
curl -X POST http://localhost:8080/diagnose \
  -H "Content-Type: application/json" \
  -d '{"symptoms": "Боль в груди, одышка, температура 38.5"}'
```

## Пересборка индекса

Если нужно обновить протоколы или индекс не включён в архив:

```bash
python build_index.py --source corpus.zip --index-dir ./index
```

## Проблемы и решения

| Проблема | Решение |
|----------|---------|
| `FAISS-индекс не найден` | Запусти `python build_index.py --source corpus.zip` |
| `LLM таймаут` | Проверь API-ключ в `.env` и доступ к `hub.qazcode.ai` |
| Модель долго скачивается | Первый запуск скачивает ~500 MB, подожди |
| Порт 8080 занят | Измени порт в `docker-compose.yml` → `"9090:8080"` |

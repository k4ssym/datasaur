# КлинДиагноз — RAG-система диагностики по клиническим протоколам РК

Система принимает анамнез пациента и возвращает диагноз по МКБ-10 на основе официальных клинических протоколов Казахстана.

## Архитектура

```
Анамнез → [LLM: извлечение симптомов] → [FAISS RAG: 1137 протоколов РК]
        → [LLM: диагноз + код МКБ-10] → ответ
```

- **LLM**: Qazcode `oss-120b` (https://hub.qazcode.ai)
- **Эмбеддинги**: `paraphrase-multilingual-MiniLM-L12-v2` (sentence-transformers, CPU, запечён в образ)
- **Индекс**: FAISS IndexFlatIP, 108 022 векторов (запечён в образ)
- **Фронтенд**: Next.js 14 + Tailwind + shadcn/ui

## Быстрый старт (Docker)

```bash
git clone https://github.com/alnurkengesbay/zhanar.git
cd zhanar
docker compose up --build
```

Первая сборка занимает ~10–15 минут (скачивает модель ~500 MB + индекс ~160 MB).
После сборки: **http://localhost:8080**

> Образ полностью автономен — не требует интернета при запуске.
> Единственный внешний вызов: Qazcode LLM API для генерации диагноза.

## Данные (GitHub Releases)

Из-за ограничений размера файлов Git, данные опубликованы в [Releases v1.0](https://github.com/alnurkengesbay/zhanar/releases/tag/v1.0):

| Файл | Размер | Описание |
|------|--------|----------|
| `corpus.zip` | 18.6 MB | 1137 клинических протоколов РК (JSONL) |
| `index.tar.gz` | 160 MB | Готовый FAISS-индекс (108k векторов) |

**Dockerfile скачивает `index.tar.gz` автоматически** при `docker compose up --build`.

Если нужно пересобрать индекс вручную:
```bash
# Скачай corpus.zip из Releases и положи в корень проекта
python build_index.py --source corpus.zip --index-dir ./index
```

## API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/predict` | Полный ответ: симптомы + протоколы + диагноз |
| POST | `/diagnose` | Совместимо с evaluate.py: `{symptoms}` → `{diagnoses: [{icd10_code}]}` |
| GET  | `/health` | Статус сервера и индекса |
| POST | `/admin/reload-prompts` | Горячая перезагрузка промптов |

### Пример запроса `/diagnose`

```bash
curl -X POST http://localhost:8080/diagnose \
  -H "Content-Type: application/json" \
  -d '{"symptoms": "Боль в груди, одышка, повышенная температура 38.5°C"}'
```

```json
{
  "diagnoses": [{"icd10_code": "J18.9"}],
  "protocol_used": "Внебольничная пневмония"
}
```

## Self-Refine оптимизация промптов

```bash
# Запусти сервер
docker compose up -d

# Запусти 5 итераций улучшения промптов
python self_refine.py \
  --test-dir data/test_set \
  --server http://localhost:8080 \
  --iterations 5 \
  --parallelism 3
```

Лучшие промпты сохраняются в `prompts_best.json`.

## Переменные окружения

| Переменная | По умолчанию | Описание |
|-----------|-------------|---------|
| `QAZCODE_API_KEY` | `sk-1f5LdNeuVjkH9U6Od6561A` | Ключ API |
| `QAZCODE_BASE_URL` | `https://hub.qazcode.ai` | URL API |
| `QAZCODE_MODEL` | `oss-120b` | Модель |
| `LLM_TIMEOUT` | `120` | Таймаут LLM (сек) |
| `RAG_TOP_K` | `4` | Кол-во протоколов из FAISS |
| `INDEX_DIR` | `/app/index` | Путь к FAISS-индексу |
| `PROMPTS_FILE` | `/app/prompts.json` | Путь к промптам |

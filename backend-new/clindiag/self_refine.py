"""
self_refine.py — Автоматическая оптимизация промптов через Self-Refine.

Алгоритм (5 итераций):
  1. Запуск всего тестового сета через /diagnose
  2. Подсчёт Accuracy@1 и Recall@3
  3. LLM-as-judge: анализ провальных кейсов
  4. LLM переписывает системные промпты с учётом ошибок
  5. Горячая перезагрузка промптов (POST /admin/reload-prompts)
  6. Повтор

В конце: сохраняет лучшие промпты в prompts_best.json, историю в self_refine_history.json.

Запуск:
  # Сначала стартуй сервер:
  uvicorn src.predict_server:app --host 0.0.0.0 --port 8080

  # Затем:
  python self_refine.py --test-dir data/test_set --server http://localhost:8080
  python self_refine.py --test-dir data/test_set --server http://localhost:8080 --iterations 5 --parallelism 3
"""

import argparse
import asyncio
import json
import logging
import os
import re
import statistics
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import httpx
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.table import Table
from rich.text import Text

# ════════════════════════════════════════════════════════════════════════════
# КОНФИГУРАЦИЯ
# ════════════════════════════════════════════════════════════════════════════

QAZCODE_BASE_URL = os.environ.get("QAZCODE_BASE_URL", "https://hub.qazcode.ai")
QAZCODE_API_KEY  = os.environ.get("QAZCODE_API_KEY", "")
QAZCODE_MODEL    = os.environ.get("QAZCODE_MODEL", "oss-120b")
PROMPTS_FILE     = "prompts.json"
BEST_PROMPTS_FILE = "prompts_best.json"
HISTORY_FILE     = "self_refine_history.json"

MAX_FAILURES_FOR_JUDGE = 20   # Кол-во провальных кейсов для LLM-анализа
MAX_QUERY_CHARS = 400          # Усечение запроса в промпте для LLM
LLM_JUDGE_TIMEOUT = 90.0      # Таймаут для LLM-вызовов оптимизации

console = Console()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("self_refine")


# ════════════════════════════════════════════════════════════════════════════
# СТРУКТУРЫ ДАННЫХ
# ════════════════════════════════════════════════════════════════════════════

@dataclass
class TestCase:
    protocol_id: str
    query: str
    gt: str               # ground-truth ICD-код
    icd_codes: list[str]  # все валидные коды протокола

@dataclass
class EvalResult:
    protocol_id: str
    query: str
    gt: str
    valid_icd_codes: list[str]
    top_prediction: str
    top_3_predictions: list[str]
    full_response: dict
    accuracy_at_1: int    # 1 или 0
    recall_at_3: int      # 1 или 0
    latency_s: float
    error: str | None = None

@dataclass
class IterationRecord:
    iteration: int
    accuracy_at_1: float
    recall_at_3: float
    total_cases: int
    failures: int
    latency_avg_s: float
    prompts_version: int
    prompts: dict[str, str]
    failure_analysis: str
    improvement_notes: str


# ════════════════════════════════════════════════════════════════════════════
# ЗАГРУЗКА ТЕСТОВОГО СЕТА
# ════════════════════════════════════════════════════════════════════════════

def load_test_cases(test_dir: Path) -> list[TestCase]:
    cases = []
    for fp in sorted(test_dir.glob("*.json")):
        try:
            with open(fp, encoding="utf-8") as f:
                data = json.load(f)
            cases.append(TestCase(
                protocol_id=data["protocol_id"],
                query=data["query"],
                gt=data["gt"],
                icd_codes=data["icd_codes"],
            ))
        except Exception as exc:
            logger.warning("Пропуск %s: %s", fp.name, exc)
    logger.info("Загружено тестовых кейсов: %d", len(cases))
    return cases


# ════════════════════════════════════════════════════════════════════════════
# ИЗВЛЕЧЕНИЕ ICD-КОДОВ ИЗ ОТВЕТА /diagnose
# ════════════════════════════════════════════════════════════════════════════

def extract_predictions(response: dict) -> list[str]:
    """
    Извлекает упорядоченный список ICD-кодов из ответа /diagnose.
    Порядок: по рангу (rank).
    """
    diagnoses = response.get("diagnoses") or []
    ranked = sorted(diagnoses, key=lambda x: x.get("rank", 999))
    return [d.get("icd10_code", "") for d in ranked if d.get("icd10_code")]


# ════════════════════════════════════════════════════════════════════════════
# ОЦЕНКА ОДНОГО КЕЙСА
# ════════════════════════════════════════════════════════════════════════════

async def evaluate_single(
    client: httpx.AsyncClient,
    endpoint: str,
    case: TestCase,
    semaphore: asyncio.Semaphore,
) -> EvalResult:
    async with semaphore:
        t0 = time.perf_counter()
        try:
            resp = await client.post(endpoint, json={"symptoms": case.query})
            latency_s = time.perf_counter() - t0
            resp.raise_for_status()
            data = resp.json()
        except httpx.TimeoutException:
            return EvalResult(
                protocol_id=case.protocol_id, query=case.query,
                gt=case.gt, valid_icd_codes=case.icd_codes,
                top_prediction="", top_3_predictions=[],
                full_response={}, accuracy_at_1=0, recall_at_3=0,
                latency_s=time.perf_counter() - t0, error="timeout",
            )
        except Exception as exc:
            return EvalResult(
                protocol_id=case.protocol_id, query=case.query,
                gt=case.gt, valid_icd_codes=case.icd_codes,
                top_prediction="", top_3_predictions=[],
                full_response={}, accuracy_at_1=0, recall_at_3=0,
                latency_s=time.perf_counter() - t0, error=str(exc)[:200],
            )

        predictions = extract_predictions(data)
        top_1 = predictions[0] if predictions else ""
        top_3 = predictions[:3]
        valid = set(case.icd_codes)

        acc1 = 1 if top_1 == case.gt else 0
        rec3 = 1 if any(c in valid for c in top_3) else 0

        return EvalResult(
            protocol_id=case.protocol_id, query=case.query,
            gt=case.gt, valid_icd_codes=case.icd_codes,
            top_prediction=top_1, top_3_predictions=top_3,
            full_response=data, accuracy_at_1=acc1, recall_at_3=rec3,
            latency_s=latency_s,
        )


# ════════════════════════════════════════════════════════════════════════════
# ПРОГОН ТЕСТОВОГО СЕТА
# ════════════════════════════════════════════════════════════════════════════

async def run_evaluation(
    cases: list[TestCase],
    server_url: str,
    parallelism: int,
    iteration: int,
) -> list[EvalResult]:
    endpoint = f"{server_url.rstrip('/')}/diagnose"
    semaphore = asyncio.Semaphore(parallelism)
    results: list[EvalResult] = []

    async with httpx.AsyncClient(timeout=90.0) as client:
        with Progress(
            SpinnerColumn(),
            TextColumn(f"[cyan]Итерация {iteration} — оценка"),
            BarColumn(bar_width=35),
            TaskProgressColumn(),
            MofNCompleteColumn(),
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            task = progress.add_task("", total=len(cases))

            async def process(case: TestCase):
                r = await evaluate_single(client, endpoint, case, semaphore)
                results.append(r)
                progress.advance(task)

            await asyncio.gather(*[process(c) for c in cases])

    return results


# ════════════════════════════════════════════════════════════════════════════
# МЕТРИКИ
# ════════════════════════════════════════════════════════════════════════════

def compute_metrics(results: list[EvalResult]) -> dict:
    n = len(results)
    if n == 0:
        return {}
    ok_results = [r for r in results if r.error is None]
    total = len(ok_results) or 1
    acc1  = sum(r.accuracy_at_1 for r in ok_results) / total * 100
    rec3  = sum(r.recall_at_3   for r in ok_results) / total * 100
    lats  = [r.latency_s for r in ok_results]
    return {
        "total": n,
        "errors": n - len(ok_results),
        "accuracy_at_1": round(acc1, 2),
        "recall_at_3":   round(rec3, 2),
        "latency_avg_s": round(statistics.mean(lats),   3) if lats else 0,
        "latency_p95_s": round(
            statistics.quantiles(lats, n=20)[-1] if len(lats) >= 4 else max(lats, default=0), 3
        ),
    }


# ════════════════════════════════════════════════════════════════════════════
# ПРОМПТЫ И ИХ УПРАВЛЕНИЕ
# ════════════════════════════════════════════════════════════════════════════

def load_prompts(path: str = PROMPTS_FILE) -> dict[str, str]:
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    return {k: v for k, v in raw.items() if not k.startswith("_") and isinstance(v, str)}


def save_prompts(prompts: dict[str, str], path: str = PROMPTS_FILE, version: int = 1):
    existing: dict = {}
    try:
        with open(path, encoding="utf-8") as f:
            existing = json.load(f)
    except Exception:
        pass
    existing.update(prompts)
    existing["_version"] = version
    with open(path, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)
    logger.info("Промпты сохранены → %s (версия %d)", path, version)


async def reload_server_prompts(server_url: str) -> bool:
    """Сигнализирует серверу перезагрузить промпты."""
    url = f"{server_url.rstrip('/')}/admin/reload-prompts"
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            resp = await c.post(url)
            resp.raise_for_status()
            logger.info("Промпты перезагружены на сервере: %s", resp.json())
            return True
    except Exception as exc:
        logger.error("Не удалось перезагрузить промпты: %s", exc)
        return False


# ════════════════════════════════════════════════════════════════════════════
# LLM-КЛИЕНТ ДЛЯ ОПТИМИЗАЦИИ
# ════════════════════════════════════════════════════════════════════════════

async def llm_call(messages: list[dict], temperature: float = 0.3, max_tokens: int = 2048) -> str:
    """Прямой асинхронный вызов Qazcode API для оптимизации промптов."""
    async with httpx.AsyncClient(
        base_url=QAZCODE_BASE_URL,
        headers={"Authorization": f"Bearer {QAZCODE_API_KEY}", "Content-Type": "application/json"},
        timeout=httpx.Timeout(LLM_JUDGE_TIMEOUT),
    ) as client:
        resp = await client.post(
            "/v1/chat/completions",
            json={"model": QAZCODE_MODEL, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


# ════════════════════════════════════════════════════════════════════════════
# LLM-AS-JUDGE: АНАЛИЗ ОШИБОК
# ════════════════════════════════════════════════════════════════════════════

async def llm_analyze_failures(
    failures: list[EvalResult],
    current_prompts: dict[str, str],
    metrics: dict,
    iteration: int,
) -> str:
    """
    LLM анализирует провальные кейсы и выявляет системные паттерны ошибок.
    Возвращает текстовый анализ.
    """
    sample = failures[:MAX_FAILURES_FOR_JUDGE]

    # Форматируем кейсы для промпта
    cases_text = ""
    for i, r in enumerate(sample, 1):
        query_snippet = r.query[:MAX_QUERY_CHARS].replace("\n", " ")
        pred_str = ", ".join(r.top_3_predictions) if r.top_3_predictions else "(пусто)"
        cases_text += (
            f"\n--- Кейс {i} ---\n"
            f"Анамнез: {query_snippet}...\n"
            f"Ожидался: {r.gt} (валидные: {', '.join(r.valid_icd_codes[:5])})\n"
            f"Предсказал (топ-3): {pred_str}\n"
        )
        # Добавляем первый диагноз из ответа
        raw_diag = r.full_response.get("diagnoses", [{}])[0] if r.full_response.get("diagnoses") else {}
        if raw_diag.get("explanation"):
            cases_text += f"Объяснение сервера: {raw_diag['explanation'][:200]}...\n"

    system_msg = """Ты эксперт по оценке медицинских AI-систем.
Твоя задача — проанализировать случаи ошибочной диагностики и выявить системные паттерны.
Отвечай чётко и структурированно."""

    user_msg = f"""## Итерация {iteration}. Текущие метрики
- Accuracy@1: {metrics.get('accuracy_at_1', 0):.1f}%
- Recall@3: {metrics.get('recall_at_3', 0):.1f}%
- Ошибок: {len(failures)} из {metrics.get('total', 0)}

## Текущие промпты

### Промпт извлечения симптомов:
{current_prompts.get('symptom_extraction_system', '')[:600]}

### Промпт диагностики:
{current_prompts.get('diagnosis_system', '')[:600]}

## Провальные кейсы (выборка {len(sample)} из {len(failures)}):
{cases_text}

## Задание
Проанализируй ошибки и ответь:

1. **Главные паттерны ошибок** (3-5 конкретных проблем):
   - Что именно идёт не так?
   - На каком шаге (извлечение симптомов / RAG / диагноз)?

2. **Гипотезы о причинах**:
   - Почему промпты не справляются?

3. **Конкретные рекомендации по улучшению промптов** (с примерами формулировок):
   - Что добавить/убрать/изменить в промпте извлечения симптомов?
   - Что добавить/убрать/изменить в промпте диагностики?
   - Как именно нужно форматировать код МКБ-10 в ответе?"""

    logger.info("LLM-judge: анализирую %d провальных кейсов...", len(sample))
    return await llm_call(
        [{"role": "system", "content": system_msg}, {"role": "user", "content": user_msg}],
        temperature=0.2,
        max_tokens=1500,
    )


# ════════════════════════════════════════════════════════════════════════════
# РЕФАЙНИНГ ПРОМПТОВ
# ════════════════════════════════════════════════════════════════════════════

async def llm_refine_prompts(
    current_prompts: dict[str, str],
    failure_analysis: str,
    metrics: dict,
    iteration: int,
    history_summary: str,
) -> tuple[dict[str, str], str]:
    """
    LLM переписывает промпты на основе анализа ошибок.
    Возвращает (новые промпты, комментарий об изменениях).
    """
    system_msg = """Ты опытный prompt engineer для медицинских AI-систем.
Твоя задача — улучшить системные промпты так, чтобы система точнее определяла коды МКБ-10.

ОБЯЗАТЕЛЬНЫЕ ОГРАНИЧЕНИЯ:
1. Промпт извлечения симптомов должен возвращать ТОЛЬКО валидный JSON (без других слов).
2. Промпт диагностики ОБЯЗАН требовать явного вывода кода МКБ-10 в формате "МКБ-10: X00.0".
3. Промпты должны быть на русском языке.
4. Не делай промпты слишком длинными (max ~600 символов каждый).

Верни ТОЛЬКО валидный JSON без markdown-обёрток:
{
  "symptom_extraction_system": "новый промпт...",
  "diagnosis_system": "новый промпт...",
  "improvement_notes": "что именно изменил и почему"
}"""

    user_msg = f"""## Итерация {iteration}. Текущие результаты
- Accuracy@1: {metrics.get('accuracy_at_1', 0):.1f}% (цель: максимизировать)
- Recall@3: {metrics.get('recall_at_3', 0):.1f}%

## История предыдущих итераций
{history_summary}

## Анализ текущих ошибок
{failure_analysis}

## Текущие промпты (для правки)

### symptom_extraction_system:
{current_prompts.get('symptom_extraction_system', '')}

### diagnosis_system:
{current_prompts.get('diagnosis_system', '')}

## Задание
Перепиши оба промпта, чтобы устранить выявленные проблемы.
Помни: главная цель — точное совпадение кода МКБ-10 с ground truth."""

    logger.info("LLM-refine: генерирую улучшенные промпты (итерация %d)...", iteration)
    raw = await llm_call(
        [{"role": "system", "content": system_msg}, {"role": "user", "content": user_msg}],
        temperature=0.4,
        max_tokens=2000,
    )

    # Извлекаем JSON из ответа
    parsed = _extract_json_safe(raw)

    new_prompts: dict[str, str] = {}
    improvement_notes = ""

    if parsed:
        if "symptom_extraction_system" in parsed:
            new_prompts["symptom_extraction_system"] = str(parsed["symptom_extraction_system"])
        if "diagnosis_system" in parsed:
            new_prompts["diagnosis_system"] = str(parsed["diagnosis_system"])
        improvement_notes = str(parsed.get("improvement_notes", ""))
    else:
        # Fallback: пытаемся вытащить промпты из текста
        logger.warning("Не удалось распарсить JSON от LLM, оставляем текущие промпты")
        new_prompts = dict(current_prompts)
        improvement_notes = f"Ошибка парсинга. Сырой ответ: {raw[:300]}"

    # Проверяем, что промпты не пустые
    for key in ["symptom_extraction_system", "diagnosis_system"]:
        if not new_prompts.get(key) or len(new_prompts[key]) < 50:
            logger.warning("Промпт '%s' слишком короткий, оставляем старый", key)
            new_prompts[key] = current_prompts.get(key, "")

    return new_prompts, improvement_notes


def _extract_json_safe(text: str) -> dict | None:
    """Безопасное извлечение JSON из текста LLM."""
    stripped = text.strip()
    for attempt in [
        lambda s: json.loads(s),
        lambda s: json.loads(re.search(r"```(?:json)?\s*(\{.*?\})\s*```", s, re.DOTALL).group(1)),
        lambda s: json.loads(re.search(r"\{.*\}", s, re.DOTALL).group(0)),
    ]:
        try:
            return attempt(stripped)
        except Exception:
            continue
    return None


# ════════════════════════════════════════════════════════════════════════════
# ВЫВОД РЕЗУЛЬТАТОВ
# ════════════════════════════════════════════════════════════════════════════

def print_iteration_summary(iteration: int, metrics: dict, improvement_notes: str):
    table = Table(
        title=f"[bold cyan]Итерация {iteration} — Результаты[/bold cyan]",
        border_style="cyan",
        show_header=True,
        header_style="bold magenta",
    )
    table.add_column("Метрика", style="cyan", width=22)
    table.add_column("Значение", style="green", justify="right", width=14)

    acc_color = "green" if metrics.get("accuracy_at_1", 0) >= 50 else "yellow"
    rec_color = "green" if metrics.get("recall_at_3", 0) >= 70 else "yellow"

    table.add_row("Accuracy@1",   f"[{acc_color}]{metrics.get('accuracy_at_1', 0):.2f}%[/{acc_color}]")
    table.add_row("Recall@3",     f"[{rec_color}]{metrics.get('recall_at_3', 0):.2f}%[/{rec_color}]")
    table.add_row("Всего кейсов", str(metrics.get("total", 0)))
    table.add_row("Ошибок HTTP",  str(metrics.get("errors", 0)))
    table.add_row("Латентность avg", f"{metrics.get('latency_avg_s', 0):.2f}s")
    table.add_row("Латентность P95", f"{metrics.get('latency_p95_s', 0):.2f}s")

    console.print()
    console.print(table)
    if improvement_notes:
        console.print(Panel(
            f"[italic]{improvement_notes[:600]}[/italic]",
            title="[yellow]Изменения промптов[/yellow]",
            border_style="yellow",
        ))


def print_final_summary(history: list[IterationRecord]):
    console.print()
    console.rule("[bold green]ФИНАЛЬНЫЙ ОТЧЁТ Self-Refine[/bold green]")

    # Таблица прогресса по итерациям
    t = Table(
        title="[bold]Динамика метрик по итерациям[/bold]",
        border_style="green", show_header=True, header_style="bold magenta",
    )
    t.add_column("Итерация",   style="cyan",    width=10)
    t.add_column("Accuracy@1", style="green",   width=14, justify="right")
    t.add_column("Recall@3",   style="blue",    width=12, justify="right")
    t.add_column("Провалов",   style="red",     width=10, justify="right")
    t.add_column("Lat avg",    style="magenta", width=10, justify="right")

    best_acc = max(r.accuracy_at_1 for r in history)
    for r in history:
        acc_str = f"[bold green]{r.accuracy_at_1:.2f}%[/bold green]" \
            if r.accuracy_at_1 == best_acc else f"{r.accuracy_at_1:.2f}%"
        t.add_row(
            str(r.iteration), acc_str, f"{r.recall_at_3:.2f}%",
            str(r.failures), f"{r.latency_avg_s:.2f}s",
        )
    console.print(t)

    first, last = history[0], history[-1]
    delta_acc = last.accuracy_at_1 - first.accuracy_at_1
    delta_rec = last.recall_at_3   - first.recall_at_3
    sign_acc  = "+" if delta_acc >= 0 else ""
    sign_rec  = "+" if delta_rec >= 0 else ""

    console.print(Panel(
        f"[bold]Изменение Accuracy@1:[/bold] {sign_acc}{delta_acc:.2f}%\n"
        f"[bold]Изменение Recall@3:[/bold]   {sign_rec}{delta_rec:.2f}%\n"
        f"[bold]Лучшая Accuracy@1:[/bold]    {best_acc:.2f}% (итерация "
        f"{next(r.iteration for r in history if r.accuracy_at_1 == best_acc)})\n"
        f"[bold]Лучшие промпты:[/bold]       {BEST_PROMPTS_FILE}",
        title="[bold green]Итог Self-Refine[/bold green]",
        border_style="green",
    ))


# ════════════════════════════════════════════════════════════════════════════
# СОХРАНЕНИЕ ИСТОРИИ
# ════════════════════════════════════════════════════════════════════════════

def save_history(history: list[IterationRecord]):
    data = []
    for r in history:
        d = asdict(r)
        data.append(d)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info("История сохранена → %s", HISTORY_FILE)


def build_history_summary(history: list[IterationRecord]) -> str:
    """Краткая сводка предыдущих итераций для LLM-промпта."""
    if not history:
        return "(первая итерация, история отсутствует)"
    lines = []
    for r in history:
        lines.append(
            f"Итерация {r.iteration}: Accuracy@1={r.accuracy_at_1:.1f}%, "
            f"Recall@3={r.recall_at_3:.1f}%, провалов={r.failures}. "
            f"Изменения: {r.improvement_notes[:200]}"
        )
    return "\n".join(lines)


# ════════════════════════════════════════════════════════════════════════════
# ПРОВЕРКА СЕРВЕРА
# ════════════════════════════════════════════════════════════════════════════

async def check_server(server_url: str) -> bool:
    url = f"{server_url.rstrip('/')}/health"
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            resp = await c.get(url)
            resp.raise_for_status()
            data = resp.json()
            logger.info("Сервер доступен: %s", data)
            if not data.get("rag", {}).get("loaded"):
                logger.warning("FAISS-индекс не загружен на сервере!")
            return True
    except Exception as exc:
        logger.error("Сервер недоступен (%s): %s", url, exc)
        return False


# ════════════════════════════════════════════════════════════════════════════
# ГЛАВНЫЙ ЦИКЛ
# ════════════════════════════════════════════════════════════════════════════

async def main(args):
    console.print(Panel(
        f"[bold cyan]Self-Refine: автоматическая оптимизация промптов[/bold cyan]\n\n"
        f"Сервер:      [yellow]{args.server}[/yellow]\n"
        f"Тестов:      [yellow]{args.test_dir}[/yellow]\n"
        f"Итерации:    [yellow]{args.iterations}[/yellow]\n"
        f"Параллельно: [yellow]{args.parallelism}[/yellow]\n"
        f"Промпты:     [yellow]{PROMPTS_FILE}[/yellow]",
        title="[bold white]Конфигурация[/bold white]",
        border_style="cyan",
    ))

    # 0. Проверяем сервер
    if not await check_server(args.server):
        console.print("[bold red]Сервер недоступен. Запустите:[/bold red]")
        console.print("  uvicorn src.predict_server:app --host 0.0.0.0 --port 8080")
        return 1

    # 1. Загружаем тестовый сет
    test_dir = Path(args.test_dir)
    if not test_dir.exists():
        console.print(f"[red]Директория не найдена: {test_dir}[/red]")
        return 1
    cases = load_test_cases(test_dir)
    if not cases:
        console.print("[red]Тестовые файлы не найдены[/red]")
        return 1

    history: list[IterationRecord] = []
    best_acc = -1.0
    best_prompts: dict[str, str] = {}

    # ══════════════════════════════════════════════════════════════════════
    # ОСНОВНОЙ ЦИКЛ SELF-REFINE
    # ══════════════════════════════════════════════════════════════════════
    for iteration in range(1, args.iterations + 1):
        console.rule(f"[bold cyan]ИТЕРАЦИЯ {iteration} / {args.iterations}[/bold cyan]")

        # ── 1. Загружаем текущие промпты ──────────────────────────────────
        current_prompts = load_prompts()
        logger.info("Текущая версия промптов: %s", current_prompts.keys())

        # ── 2. Прогон тестового сета ──────────────────────────────────────
        results = await run_evaluation(cases, args.server, args.parallelism, iteration)
        metrics = compute_metrics(results)

        failures    = [r for r in results if r.accuracy_at_1 == 0 and not r.error]
        error_cases = [r for r in results if r.error]

        logger.info(
            "Итерация %d: Accuracy@1=%.1f%%, Recall@3=%.1f%%, провалов=%d, HTTP-ошибок=%d",
            iteration, metrics["accuracy_at_1"], metrics["recall_at_3"],
            len(failures), len(error_cases),
        )

        # ── 3. Сохраняем лучшие промпты ───────────────────────────────────
        if metrics["accuracy_at_1"] > best_acc:
            best_acc = metrics["accuracy_at_1"]
            best_prompts = dict(current_prompts)
            save_prompts(best_prompts, BEST_PROMPTS_FILE, version=iteration)
            logger.info("Новый рекорд! Accuracy@1=%.1f%% → %s", best_acc, BEST_PROMPTS_FILE)

        # ── 4. LLM-as-judge: анализ ошибок ────────────────────────────────
        failure_analysis = ""
        improvement_notes = ""
        new_prompts = dict(current_prompts)

        if failures:
            try:
                failure_analysis = await llm_analyze_failures(
                    failures, current_prompts, metrics, iteration
                )
                logger.info("LLM-анализ завершён (%d симв.)", len(failure_analysis))
            except Exception as exc:
                logger.error("Ошибка LLM-анализа: %s", exc)
                failure_analysis = f"Ошибка анализа: {exc}"

            # ── 5. Рефайнинг промптов ─────────────────────────────────────
            if iteration < args.iterations:  # Последняя итерация — не переписываем
                try:
                    history_summary = build_history_summary(history)
                    new_prompts, improvement_notes = await llm_refine_prompts(
                        current_prompts, failure_analysis,
                        metrics, iteration, history_summary,
                    )
                    logger.info(
                        "Промпты обновлены. Изменения: %s", improvement_notes[:200]
                    )
                except Exception as exc:
                    logger.error("Ошибка рефайнинга промптов: %s", exc)
                    improvement_notes = f"Ошибка: {exc}"
        else:
            improvement_notes = "Провальных кейсов нет — промпты не меняем."
            logger.info("Все кейсы пройдены успешно!")

        # ── 6. Сохраняем промпты и перезагружаем сервер ──────────────────
        if iteration < args.iterations and new_prompts != current_prompts:
            save_prompts(new_prompts, PROMPTS_FILE, version=iteration + 1)
            reloaded = await reload_server_prompts(args.server)
            if not reloaded:
                logger.warning("Сервер не перезагрузил промпты — проверьте /admin/reload-prompts")

        # ── 7. Сохраняем запись итерации ─────────────────────────────────
        record = IterationRecord(
            iteration=iteration,
            accuracy_at_1=metrics["accuracy_at_1"],
            recall_at_3=metrics["recall_at_3"],
            total_cases=metrics["total"],
            failures=len(failures),
            latency_avg_s=metrics.get("latency_avg_s", 0),
            prompts_version=iteration,
            prompts=new_prompts,
            failure_analysis=failure_analysis,
            improvement_notes=improvement_notes,
        )
        history.append(record)
        save_history(history)

        # ── 8. Вывод итогов итерации ──────────────────────────────────────
        print_iteration_summary(iteration, metrics, improvement_notes)

        # Пауза между итерациями, чтобы не перегружать LLM API
        if iteration < args.iterations:
            await asyncio.sleep(2)

    # ══════════════════════════════════════════════════════════════════════
    # ФИНАЛ: восстанавливаем лучшие промпты
    # ══════════════════════════════════════════════════════════════════════
    if best_prompts:
        save_prompts(best_prompts, PROMPTS_FILE, version=999)
        await reload_server_prompts(args.server)
        logger.info("Восстановлены лучшие промпты (Accuracy@1=%.1f%%)", best_acc)

    print_final_summary(history)

    # Сохраняем итоговый CSV-отчёт
    csv_path = Path("self_refine_results.csv")
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("iteration,accuracy_at_1,recall_at_3,failures,latency_avg_s\n")
        for r in history:
            f.write(f"{r.iteration},{r.accuracy_at_1},{r.recall_at_3},"
                    f"{r.failures},{r.latency_avg_s}\n")
    logger.info("CSV-отчёт → %s", csv_path)

    return 0


# ════════════════════════════════════════════════════════════════════════════
# ТОЧКА ВХОДА
# ════════════════════════════════════════════════════════════════════════════

def parse_args():
    p = argparse.ArgumentParser(
        description="Self-Refine: автоматическая оптимизация промптов клинической диагностики",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры:
  python self_refine.py --test-dir data/test_set --server http://localhost:8080
  python self_refine.py --test-dir data/test_set --server http://localhost:8080 --iterations 3 --parallelism 5
        """,
    )
    p.add_argument("--test-dir",     required=True, help="Путь к data/test_set/")
    p.add_argument("--server",       default="http://localhost:8080", help="URL FastAPI сервера")
    p.add_argument("--iterations",   type=int, default=5, help="Кол-во итераций (по умолч. 5)")
    p.add_argument("--parallelism",  type=int, default=3, help="Параллельных запросов (по умолч. 3)")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    exit(asyncio.run(main(args)))

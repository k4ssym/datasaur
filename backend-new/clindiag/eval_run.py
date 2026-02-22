"""
eval_run.py — Прогон всех тестовых кейсов через /diagnose, подсчёт Accuracy@1 и Recall@3.
"""
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

SERVER = os.environ.get("SERVER_URL", "http://localhost:8081")
TEST_DIR = os.environ.get("TEST_DIR", "data/test_set")
TIMEOUT = int(os.environ.get("REQ_TIMEOUT", "180"))
DELAY = float(os.environ.get("REQ_DELAY", "2.0"))
MAX_RETRIES = int(os.environ.get("MAX_RETRIES", "3"))

def load_tests(test_dir: str) -> list[dict]:
    tests = []
    for f in sorted(Path(test_dir).glob("p_*.json")):
        with open(f, encoding="utf-8") as fp:
            data = json.load(fp)
        tests.append({
            "file": f.name,
            "query": data["query"],
            "gt": data["gt"],
            "icd_codes": data.get("icd_codes", [data["gt"]]),
        })
    return tests

def call_diagnose(query: str) -> dict | None:
    data = json.dumps({"symptoms": query}).encode("utf-8")
    req = urllib.request.Request(
        f"{SERVER}/diagnose",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    for attempt in range(MAX_RETRIES):
        try:
            resp = urllib.request.urlopen(req, timeout=TIMEOUT)
            return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            err_msg = str(e)
            if hasattr(e, 'read'):
                try:
                    err_msg = e.read().decode('utf-8')
                except:
                    pass
            if attempt < MAX_RETRIES - 1:
                wait = (attempt + 1) * 5
                print(f"    retry {attempt+1}/{MAX_RETRIES} in {wait}s... ({err_msg[:80]})")
                sys.stdout.flush()
                time.sleep(wait)
            else:
                return {"error": err_msg[:200]}

def normalize_icd(code: str) -> str:
    return code.replace(".", "").upper().strip()

def icd_match(predicted: str, valid_codes: list[str]) -> bool:
    pred = normalize_icd(predicted)
    for vc in valid_codes:
        norm = normalize_icd(vc)
        if pred == norm or pred[:3] == norm[:3]:
            return True
    return False

def main():
    tests = load_tests(TEST_DIR)
    print(f"Тестов: {len(tests)}")
    print(f"Сервер: {SERVER}")
    print(f"Таймаут: {TIMEOUT}s | Пауза: {DELAY}s | Ретраи: {MAX_RETRIES}")
    print("=" * 70)

    # Перезагрузим промпты
    try:
        req = urllib.request.Request(f"{SERVER}/admin/reload-prompts", method="POST")
        urllib.request.urlopen(req, timeout=10)
        print("Промпты перезагружены")
    except:
        pass

    correct_at1 = 0
    hit_at3 = 0
    errors = 0
    results = []
    t_start = time.time()

    for i, t in enumerate(tests):
        t0 = time.time()
        resp = call_diagnose(t["query"])
        elapsed = time.time() - t0

        if "error" in resp:
            status = "ERROR"
            pred_codes = []
            errors += 1
        else:
            pred_codes = [d["icd10_code"] for d in resp.get("diagnoses", [])]
            top1 = pred_codes[0] if pred_codes else ""
            top3 = pred_codes[:3]

            acc1 = icd_match(top1, t["icd_codes"]) if top1 else False
            rec3 = any(icd_match(c, t["icd_codes"]) for c in top3)

            if acc1:
                correct_at1 += 1
            if rec3:
                hit_at3 += 1

            status = "OK" if acc1 else ("R3" if rec3 else "MISS")

        results.append({
            "file": t["file"],
            "gt": t["gt"],
            "valid": t["icd_codes"],
            "predicted": pred_codes[:3],
            "status": status,
            "time": round(elapsed, 1),
        })

        done = i + 1
        success = done - errors
        acc_pct = correct_at1 / success * 100 if success else 0
        rec_pct = hit_at3 / success * 100 if success else 0
        sym = {"OK": "+", "R3": "~", "MISS": "X", "ERROR": "!"}[status]
        pred_str = pred_codes[0] if pred_codes else "—"
        print(
            f"[{done:3d}/{len(tests)}] {sym} "
            f"gt={t['gt']:8s} pred={pred_str:8s} "
            f"{elapsed:5.1f}s | "
            f"Acc@1={acc_pct:5.1f}% Rec@3={rec_pct:5.1f}% err={errors}"
        )
        sys.stdout.flush()

        # Пауза между запросами чтобы не ловить rate-limit
        if i < len(tests) - 1:
            time.sleep(DELAY)

    total_time = time.time() - t_start
    n = len(tests)
    success = n - errors

    print()
    print("=" * 70)
    print(f"ИТОГО: {n} тестов за {total_time:.0f}s ({total_time/60:.1f} мин)")
    print(f"  Успешных: {success}/{n}")
    print(f"  Ошибок:   {errors}")
    print()
    if success > 0:
        print(f"  Accuracy@1: {correct_at1}/{success} = {correct_at1/success*100:.1f}%")
        print(f"  Recall@3:   {hit_at3}/{success} = {hit_at3/success*100:.1f}%")
    print(f"  Accuracy@1 (все): {correct_at1}/{n} = {correct_at1/n*100:.1f}%")
    print(f"  Recall@3   (все): {hit_at3}/{n} = {hit_at3/n*100:.1f}%")
    print("=" * 70)

    with open("eval_results.json", "w", encoding="utf-8") as f:
        json.dump({
            "accuracy_at1": round(correct_at1 / success, 4) if success else 0,
            "recall_at3": round(hit_at3 / success, 4) if success else 0,
            "total": n,
            "success": success,
            "correct_at1": correct_at1,
            "hit_at3": hit_at3,
            "errors": errors,
            "total_time_s": round(total_time, 1),
            "results": results,
        }, f, ensure_ascii=False, indent=2)
    print("Результаты сохранены в eval_results.json")

if __name__ == "__main__":
    main()

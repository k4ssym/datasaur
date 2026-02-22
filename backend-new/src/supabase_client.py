"""Supabase Auth and PostgREST client (httpx)."""
import os
import logging
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

DEFAULT_HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}


def _auth_error_message(data: dict, fallback: str = "Unknown error") -> str:
    msg = (
        data.get("msg")
        or data.get("error_description")
        or data.get("message")
        or data.get("error")
        or (data.get("errors", [{}])[0].get("message") if data.get("errors") else None)
        or fallback
    )
    if isinstance(msg, dict):
        msg = msg.get("msg") or msg.get("message") or fallback
    return str(msg).strip()


def _is_rate_limit_error(msg: str) -> bool:
    return "rate limit" in msg.lower() or "too many" in msg.lower() or "429" in msg


async def auth_signup(email: str, password: str, name: Optional[str] = None) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        payload: dict[str, Any] = {"email": email, "password": password}
        if name:
            payload["options"] = {"data": {"full_name": name}}
        r = await client.post(f"{SUPABASE_URL}/auth/v1/signup", headers=DEFAULT_HEADERS, json=payload)
        try:
            data = r.json()
        except Exception:
            data = {}
        if r.status_code >= 400:
            msg = _auth_error_message(data, r.text or "Registration failed")
            if _is_rate_limit_error(msg):
                raise ValueError("rate_limit")
            raise ValueError(msg)
        return data


async def auth_signin(email: str, password: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers=DEFAULT_HEADERS,
            json={"email": email, "password": password},
        )
        try:
            data = r.json()
        except Exception:
            data = {}
        if r.status_code >= 400:
            msg = _auth_error_message(data, r.text or "Login failed")
            if _is_rate_limit_error(msg):
                raise ValueError("rate_limit")
            if "invalid" in msg.lower() or "credentials" in msg.lower() or r.status_code == 400:
                raise ValueError("invalid_credentials")
            raise ValueError(msg)
        return data


async def auth_user(access_token: str) -> Optional[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={**DEFAULT_HEADERS, "Authorization": f"Bearer {access_token}"},
        )
        if r.status_code != 200:
            return None
        return r.json()


ADMIN_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


def _rest_headers(token: Optional[str] = None) -> dict[str, str]:
    h = {"apikey": SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json"}
    h["Authorization"] = f"Bearer {token}" if token else f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
    return h


async def ensure_admin_user(email: str = "admin@example.com", password: str = "asdf1234") -> None:
    if not (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY):
        return
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=ADMIN_HEADERS,
            json={"email": email, "password": password, "email_confirm": True, "user_metadata": {"full_name": "Admin"}},
        )
        if r.status_code in (200, 201):
            logger.info("Admin user %s created", email)
            return
        try:
            data = r.json()
        except Exception:
            data = {}
        err_msg = _auth_error_message(data, r.text or "")
        already = r.status_code == 422 or (r.status_code == 400 and "already" in err_msg.lower())
        if not already:
            logger.warning("Admin user create failed: %s %s", r.status_code, err_msg)
            return
        list_r = await client.get(
            f"{SUPABASE_URL}/auth/v1/admin/users", headers=ADMIN_HEADERS, params={"page": 1, "per_page": 100}
        )
        if list_r.status_code != 200:
            return
        try:
            j = list_r.json()
            users = j.get("users", j) if isinstance(j, dict) else (j if isinstance(j, list) else [])
        except Exception:
            users = []
        for u in users:
            if (u.get("email") or "").strip().lower() == email.strip().lower():
                uid = u.get("id")
                if not uid:
                    return
                put_r = await client.put(
                    f"{SUPABASE_URL}/auth/v1/admin/users/{uid}", headers=ADMIN_HEADERS, json={"password": password}
                )
                if put_r.status_code in (200, 204):
                    logger.info("Admin user %s password updated", email)
                return
        logger.warning("Admin user %s not found in list", email)


async def history_list(user_id: str) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/analysis_history",
            headers=_rest_headers(),
            params={"user_id": f"eq.{user_id}", "order": "created_at.desc"},
        )
        if r.status_code >= 400:
            logger.warning("history_list failed: %s %s", r.status_code, r.text)
            return []
        return r.json() if r.content else []


async def history_insert(user_id: str, item: dict[str, Any]) -> Optional[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        row = {
            "user_id": user_id,
            "primary_diagnosis": item.get("primaryDiagnosis", ""),
            "icd10_code": item.get("icd10Code", ""),
            "confidence_score": item.get("confidenceScore"),
            "protocol_reference": item.get("protocolReference"),
            "differential_diagnoses": item.get("differentialDiagnoses", []),
            "raw_protocol_snippets": item.get("rawProtocolSnippets"),
            "input_preview": item.get("inputPreview", "")[:500],
            "input_text": item.get("inputText"),
        }
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/analysis_history",
            headers={**_rest_headers(), "Prefer": "return=representation"},
            json=row,
        )
        if r.status_code >= 400:
            logger.warning("history_insert failed: %s %s", r.status_code, r.text)
            return None
        out = r.json()
        return out[0] if isinstance(out, list) and out else out


async def history_delete(user_id: str, item_id: str) -> bool:
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/analysis_history",
            headers=_rest_headers(),
            params={"id": f"eq.{item_id}", "user_id": f"eq.{user_id}"},
        )
        return r.status_code in (200, 204)


async def history_clear(user_id: str) -> bool:
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/analysis_history",
            headers=_rest_headers(),
            params={"user_id": f"eq.{user_id}"},
        )
        return r.status_code in (200, 204)

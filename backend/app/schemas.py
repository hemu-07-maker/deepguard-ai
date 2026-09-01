"""Request/response shapes for the analysis API."""
from __future__ import annotations

from typing import Any, Optional


def normalize_analyze_payload(body: dict[str, Any]) -> dict[str, Any]:
    return {
        "file_name": str(body.get("fileName") or body.get("file_name") or "capture"),
        "file_size": int(body.get("fileSize") or body.get("file_size") or 0),
        "file_type": str(body.get("fileType") or body.get("file_type") or "image/jpeg"),
        "mode": str(body.get("mode") or "image").lower(),
    }


def public_user(row: Optional[dict]) -> Optional[dict]:
    if not row:
        return None
    return {
        "id": row.get("id"),
        "email": row.get("email"),
        "name": row.get("name"),
    }

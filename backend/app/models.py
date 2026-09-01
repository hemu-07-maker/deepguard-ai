"""Data access helpers for users and detection history."""
from __future__ import annotations

import json
from typing import Any, Optional

from app.database import get_conn


def get_user_by_email(email: str) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute(
        "SELECT id, email, name, created_at FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def create_user(email: str, name: str, password_hash: str) -> int:
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
        (email.strip().lower(), name, password_hash),
    )
    conn.commit()
    uid = cur.lastrowid
    conn.close()
    return int(uid)


def list_history(user_id: int, limit: int = 50) -> list[dict[str, Any]]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM history WHERE user_id = ? ORDER BY id DESC LIMIT ?",
        (user_id, limit),
    ).fetchall()
    conn.close()
    items = []
    for r in rows:
        items.append(
            {
                "fileName": r["file_name"],
                "verdict": r["verdict"],
                "confidence": r["confidence"],
                "mode": r["mode"],
                "latencyMs": r["latency_ms"],
                "facesDetected": r["faces_detected"],
                "artifacts": json.loads(r["artifacts"] or "[]"),
                "reasoning": r["reasoning"],
                "timestamp": r["created_at"],
            }
        )
    return items


def insert_history(user_id: int, result: dict[str, Any]) -> None:
    conn = get_conn()
    conn.execute(
        """INSERT INTO history
           (user_id, file_name, verdict, confidence, mode, latency_ms, faces_detected, artifacts, reasoning)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            user_id,
            result.get("fileName"),
            result.get("verdict"),
            result.get("confidence"),
            result.get("mode"),
            result.get("latencyMs"),
            result.get("facesDetected"),
            json.dumps(result.get("artifacts") or []),
            result.get("reasoning"),
        ),
    )
    conn.commit()
    conn.close()


def clear_history(user_id: int) -> None:
    conn = get_conn()
    conn.execute("DELETE FROM history WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()


def history_stats(user_id: int) -> dict[str, Any]:
    items = list_history(user_id, limit=500)
    total = len(items)
    if not total:
        return {"total": 0, "fake_rate": 0, "avg_confidence": 0, "avg_latency": 0}
    fakes = sum(1 for h in items if h["verdict"] == "FAKE")
    avg_c = round(sum(h["confidence"] for h in items) / total)
    avg_l = round(sum(h.get("latencyMs") or 0 for h in items) / total)
    return {
        "total": total,
        "fake_rate": round(fakes / total * 100),
        "avg_confidence": avg_c,
        "avg_latency": avg_l,
    }

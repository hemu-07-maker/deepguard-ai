from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, Form, Request, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

from app.auth import hash_password, verify_password
from app.database import get_conn, init_db
from app.detection import analyze

BASE = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE / "templates"))

app = FastAPI(title="DeepGuard AI")
app.add_middleware(SessionMiddleware, secret_key="deepguard-change-me-in-production-32chars")
app.mount("/static", StaticFiles(directory=str(BASE / "static")), name="static")


@app.on_event("startup")
def startup():
    init_db()


def current_user(request: Request):
    uid = request.session.get("user_id")
    if not uid:
        return None
    conn = get_conn()
    row = conn.execute("SELECT id, email, name FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    return dict(row) if row else None


# ---------- pages ----------

@app.get("/", response_class=HTMLResponse)
def landing(request: Request):
    return templates.TemplateResponse("landing.html", {"request": request, "user": current_user(request)})


@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    if current_user(request):
        return RedirectResponse("/console", status_code=302)
    return templates.TemplateResponse("login.html", {"request": request, "error": None})


@app.post("/login")
def login_post(request: Request, email: str = Form(...), password: str = Form(...)):
    email = email.strip().lower()
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not row or not verify_password(password, row["password_hash"]):
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "error": "Invalid email or password"},
            status_code=401,
        )
    request.session["user_id"] = row["id"]
    return RedirectResponse("/console", status_code=302)


@app.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    if current_user(request):
        return RedirectResponse("/console", status_code=302)
    return templates.TemplateResponse("register.html", {"request": request, "error": None})


@app.post("/register")
def register_post(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(""),
):
    email = email.strip().lower()
    name = (name or email.split("@")[0]).strip()
    if len(password) < 6:
        return templates.TemplateResponse(
            "register.html",
            {"request": request, "error": "Password must be at least 6 characters"},
            status_code=400,
        )
    conn = get_conn()
    try:
        conn.execute(
            "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
            (email, name, hash_password(password)),
        )
        conn.commit()
        uid = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()["id"]
    except Exception:
        conn.close()
        return templates.TemplateResponse(
            "register.html",
            {"request": request, "error": "Email already registered"},
            status_code=409,
        )
    conn.close()
    request.session["user_id"] = uid
    return RedirectResponse("/console", status_code=302)


@app.get("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/login", status_code=302)


@app.get("/console", response_class=HTMLResponse)
def console(request: Request):
    user = current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=302)
    return templates.TemplateResponse("console.html", {"request": request, "user": user})


# ---------- API ----------

@app.post("/api/analyze")
async def api_analyze(request: Request):
    user = current_user(request)
    if not user:
        raise HTTPException(401, "Unauthorized")
    body = await request.json()
    result = analyze(
        file_name=body.get("fileName") or "capture",
        file_size=int(body.get("fileSize") or 0),
        file_type=body.get("fileType") or "image/jpeg",
        mode=body.get("mode") or "image",
    )
    # persist history
    conn = get_conn()
    conn.execute(
        """INSERT INTO history
           (user_id, file_name, verdict, confidence, mode, latency_ms, faces_detected, artifacts, reasoning)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            user["id"],
            result["fileName"],
            result["verdict"],
            result["confidence"],
            result["mode"],
            result["latencyMs"],
            result["facesDetected"],
            json.dumps(result["artifacts"]),
            result["reasoning"],
        ),
    )
    conn.commit()
    conn.close()
    return JSONResponse(result)


@app.post("/api/analyze-file")
async def api_analyze_file(request: Request, file: UploadFile = File(...)):
    """Real image forensics: accepts an actual uploaded image and runs
    NumPy/Pillow-based signal analysis instead of the metadata-only path."""
    user = current_user(request)
    if not user:
        raise HTTPException(401, "Unauthorized")

    image_bytes = await file.read()
    result = analyze(
        file_name=file.filename or "capture",
        file_type=file.content_type or "image/jpeg",
        mode="image",
        image_bytes=image_bytes,
    )

    conn = get_conn()
    conn.execute(
        """INSERT INTO history
           (user_id, file_name, verdict, confidence, mode, latency_ms, faces_detected, artifacts, reasoning)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            user["id"],
            result["fileName"],
            result["verdict"],
            result["confidence"],
            result["mode"],
            result["latencyMs"],
            result["facesDetected"],
            json.dumps(result["artifacts"]),
            result["reasoning"],
        ),
    )
    conn.commit()
    conn.close()
    return JSONResponse(result)


@app.get("/api/history")
def api_history(request: Request):
    user = current_user(request)
    if not user:
        raise HTTPException(401, "Unauthorized")
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM history WHERE user_id = ? ORDER BY id DESC LIMIT 50",
        (user["id"],),
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
    return JSONResponse(items)


@app.delete("/api/history")
def api_clear_history(request: Request):
    user = current_user(request)
    if not user:
        raise HTTPException(401, "Unauthorized")
    conn = get_conn()
    conn.execute("DELETE FROM history WHERE user_id = ?", (user["id"],))
    conn.commit()
    conn.close()
    return JSONResponse({"ok": True})


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "deepguard-python"}

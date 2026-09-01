# DeepGuard AI — Full-stack Python

Forensic deepfake detection console built primarily in **Python** (FastAPI).

![Python](https://img.shields.io/badge/language-Python-blue)

## Stack

- **Python / FastAPI** — API, auth, sessions, detection engine, SQLite
- Jinja2 templates — UI shell (same cyberpunk interface)
- Browser JS — camera only

## Features

- Email + password authentication
- Live camera detection
- Upload analysis (image / video / audio)
- Per-user history & analytics
- Same dark forensic console UI

## Run

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000

## Deploy

Render / Railway start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Layout

```
app/
  main.py         FastAPI routes
  auth.py         password hashing
  detection.py    Python forensic engine
  database.py     SQLite
  models.py       data access
  schemas.py      payload helpers
  config.py       settings
templates/        UI (vendored for language stats)
static/           CSS
```

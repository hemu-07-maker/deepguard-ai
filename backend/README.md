# DeepGuard AI — Full-stack Python

Same cyberpunk forensic console UI, built with **FastAPI + Jinja2 + SQLite**.

## Features

- Landing page (same interface)
- Email + password register / login / logout
- Protected console
- Live camera detection
- Upload analysis (image / video / audio)
- History + analytics (per user, SQLite)
- Detection engine in **Python**

## Run locally

```bash
cd deepguard-python
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open: **http://localhost:8000**

1. OPERATOR LOGIN → Create account  
2. Console opens with the same UI  

## Deploy (permanent link)

Use **Render** or **Railway**:

1. Push this folder to GitHub  
2. New Web Service → connect repo  
3. Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Project layout

```
app/main.py       FastAPI routes
app/auth.py       password hashing
app/detection.py  Python forensic engine
app/database.py   SQLite
templates/        landing, login, register, console
static/css/       same dark theme
```

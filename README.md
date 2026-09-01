# DeepGuard AI

Multi-modal deepfake detection console — forensic-style ops UI for analyzing images, video, and audio for signs of manipulation.

This repo contains two independent implementations of the same product:

| Folder | Stack | Description |
|---|---|---|
| [`frontend/`](./frontend) | Next.js | Client-rendered console with live webcam detection, upload analysis, history, and analytics. Heuristic detection engine, no backend required. |
| [`backend/`](./backend) | FastAPI + Jinja2 + SQLite | Full-stack version with user accounts (register/login), server-rendered console, and a Python detection engine with per-user history. |

Each has its own README with setup and deployment instructions.

## Features (both versions)

- Landing page with product overview
- Live camera-based detection
- Upload analysis for image / video / audio
- Detection history log
- Analytics dashboard (verdict split, modality breakdown, confidence)

## Quick start

**Frontend (Next.js):**
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000

**Backend (Python/FastAPI):**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open http://localhost:8000

## Project structure

```
deepguard-ai/
├── frontend/     # Next.js console (see frontend/README.md)
└── backend/      # FastAPI console with auth + SQLite (see backend/README.md)
```

## License

MIT — demo / portfolio use.

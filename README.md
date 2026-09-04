# DeepGuard AI

An image-forensics deepfake detection system. The core is a Python/NumPy
signal-processing pipeline that extracts explainable forensic features from
an image and scores the likelihood it's synthetic — served through a
FastAPI backend, with a companion Next.js console UI.

## 🧠 AI/ML Pipeline — breakdown

| Component | What it does | Link |
|---|---|---|
| **Feature extraction engine** | Noise-residual variance, edge-density, FFT frequency-energy ratio, and inter-channel correlation — computed directly from pixel data with NumPy/Pillow | [`backend/app/ml_features.py`](./backend/app/ml_features.py) |
| **Detection service** | Wraps the feature extractor into a scored verdict (REAL/FAKE + confidence + triggered artifacts) | [`backend/app/detection.py`](./backend/app/detection.py) |
| **Analysis endpoint** | Accepts a real uploaded image and runs it through the pipeline | [`backend/app/main.py`](./backend/app/main.py) → `POST /api/analyze-file` |
| **Demo notebook** | Generates synthetic test images, runs the full pipeline, visualizes each forensic signal and a noise-sensitivity sweep | [`backend/notebooks/forensic_analysis_demo.ipynb`](./backend/notebooks/forensic_analysis_demo.ipynb) |
| **Test suite** | 12 automated tests validating determinism, output bounds, and signal behavior against synthetic camera-like vs. generator-like images | [`backend/tests/test_ml_features.py`](./backend/tests/test_ml_features.py) |

**Method:** classical (non-deep-learning) forensic signal analysis — explainable
by design. Each of the four signals is individually interpretable and maps to
a real, documented artifact of synthetic image generation (over-smoothing,
spectral anomalies, unnatural color correlation). See the module docstring in
`ml_features.py` for the full technical rationale, and the notebook for a
worked example with plots.

## Repo structure

```
deepguard-ai/
├── backend/                     # FastAPI + Python AI/ML core
│   ├── app/
│   │   ├── ml_features.py       # forensic feature extraction (NumPy/Pillow)
│   │   ├── detection.py         # scoring / verdict layer
│   │   ├── main.py              # FastAPI app + routes
│   │   ├── auth.py / database.py / models.py / schemas.py / config.py
│   ├── notebooks/
│   │   └── forensic_analysis_demo.ipynb
│   ├── tests/
│   │   └── test_ml_features.py
│   ├── templates/ · static/     # server-rendered UI (Jinja2)
│   └── requirements.txt / requirements-dev.txt
└── frontend/                    # companion Next.js console (see frontend/README.md)
```

## Quick start

**Backend (Python/FastAPI + AI/ML pipeline):**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open http://localhost:8000

Run the tests:
```bash
pip install -r requirements-dev.txt
pytest tests/ -v
```

Run the notebook:
```bash
pip install -r requirements-dev.txt
jupyter notebook notebooks/forensic_analysis_demo.ipynb
```

**Frontend (Next.js console):**
```bash
cd frontend
npm install
npm run dev
```
Live: https://deepguard-ai-4.vercel.app/

## License

MIT — demo / portfolio use.

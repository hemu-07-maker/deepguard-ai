"""Application configuration."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "deepguard.db"

SECRET_KEY = os.getenv("SECRET_KEY", "deepguard-change-me-in-production-32chars")
SESSION_MAX_AGE = int(os.getenv("SESSION_MAX_AGE", str(60 * 60 * 24 * 7)))
APP_NAME = "DeepGuard AI"
APP_TAGLINE = "Forensic Ops Console"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

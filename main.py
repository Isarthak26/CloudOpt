"""Vercel-compatible entrypoint for the existing CloudOpt FastAPI app."""

from __future__ import annotations

import sys
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = REPOSITORY_ROOT / "backend"

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app  # noqa: E402,F401

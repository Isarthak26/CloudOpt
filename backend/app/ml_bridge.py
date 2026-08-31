"""Make the repository-root `ml` package importable from the FastAPI app.

Path resolution is based on this file's location, not the process cwd:

    this file:  <repo>/backend/app/ml_bridge.py
    parents[0]: <repo>/backend/app
    parents[1]: <repo>/backend
    parents[2]: <repo>

That is the same layout GitHub Actions uses after checkout (workflow cwd is
<repo>, `pytest ml/tests backend/tests`). It also works when the documented
local command is `cd backend && uvicorn app.main:app`, because sys.path is
updated from __file__, not from os.getcwd().

CI additionally sets pythonpath = ["backend", "."] in pyproject.toml; this
insert is still required for uvicorn started from backend/.
"""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def ensure_ml_importable() -> Path:
    root = str(REPO_ROOT)
    if root not in sys.path:
        sys.path.insert(0, root)
    return REPO_ROOT

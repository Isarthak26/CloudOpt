"""Configuration read from the environment."""

from dataclasses import dataclass
import os
from pathlib import Path


def _load_local_env() -> None:
    """Load simple KEY=VALUE entries from the repository .env file if present.

    Environment variables already supplied by the shell always take precedence.
    A full secret-management solution is intentionally deferred to later phases.
    """

    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key and key not in os.environ:
            os.environ[key] = value.strip().strip('"').strip("'")


_load_local_env()


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://cloudopt:change-me@localhost:5432/cloudopt",
    )


settings = Settings()

import os
from pathlib import Path

TEST_DATABASE = Path(__file__).parent / "test_cloudopt.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE}"


def pytest_sessionstart() -> None:
    TEST_DATABASE.unlink(missing_ok=True)


def pytest_sessionfinish() -> None:
    TEST_DATABASE.unlink(missing_ok=True)

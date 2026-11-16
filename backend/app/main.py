from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api import compute, health, orders, products, recommendations
from app.database import Base, SessionLocal, engine
from app.models import Order, Product  # Import models before create_all.


def seed_products(db: Session) -> None:
    """Provide minimal sample data for the Phase 1 measurable API."""

    if db.scalar(select(Product.id).limit(1)) is not None:
        return
    db.add_all(
        [
            Product(name="CloudOpt Starter", price=9.99, stock=50),
            Product(name="Metrics Toolkit", price=19.99, stock=25),
            Product(name="Experiment Pack", price=29.99, stock=10),
        ]
    )
    db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create the small Phase 1 schema and seed local sample records."""

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_products(db)
    yield


app = FastAPI(
    title="CloudOpt AI API",
    version="0.1.0",
    description="Measured cloud-resource decision support and evidence dashboard.",
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(compute.router)
app.include_router(recommendations.router)


# A production frontend build can be served by the same FastAPI process. This
# keeps the public deployment same-origin and avoids a separate CORS surface.
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
FRONTEND_INDEX = FRONTEND_DIST / "index.html"

if FRONTEND_INDEX.is_file():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/{frontend_path:path}", include_in_schema=False)
    def serve_frontend(frontend_path: str) -> FileResponse:
        """Serve built files and fall back to index.html for React routes."""

        candidate = (FRONTEND_DIST / frontend_path).resolve()
        if candidate.is_relative_to(FRONTEND_DIST.resolve()) and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_INDEX)

from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api import compute, health, orders, products
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
    description="Phase 1: measurable FastAPI application backed by PostgreSQL.",
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(compute.router)

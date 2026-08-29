"""Small API designed to provide safe, measurable local workload."""

from time import perf_counter

from fastapi import FastAPI, HTTPException, Query, Request, Response, status
from pydantic import BaseModel, Field
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

REQUEST_COUNT = Counter(
    "demo_target_http_requests_total",
    "Total HTTP requests handled by the demo target.",
    ["method", "path", "status"],
)
REQUEST_LATENCY = Histogram(
    "demo_target_http_request_duration_seconds",
    "HTTP request duration for the demo target.",
    ["method", "path"],
)

PRODUCTS = [
    {"id": 1, "name": "Starter plan", "price": 9.99},
    {"id": 2, "name": "Team plan", "price": 19.99},
    {"id": 3, "name": "Scale plan", "price": 39.99},
]


class OrderCreate(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=20)


app = FastAPI(
    title="CloudOpt Demo Target",
    version="0.1.0",
    description="A local, containerized workload target for CloudOpt AI monitoring.",
)


@app.middleware("http")
async def observe_request(request: Request, call_next) -> Response:
    """Record low-cardinality request metrics for Prometheus."""

    started_at = perf_counter()
    response = await call_next(request)
    known_paths = {"/health", "/products", "/orders", "/compute", "/metrics"}
    path = request.url.path if request.url.path in known_paths else "other"
    REQUEST_COUNT.labels(request.method, path, str(response.status_code)).inc()
    REQUEST_LATENCY.labels(request.method, path).observe(perf_counter() - started_at)
    return response


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/products", tags=["products"])
def list_products() -> list[dict[str, int | float | str]]:
    return PRODUCTS


@app.post("/orders", status_code=status.HTTP_201_CREATED, tags=["orders"])
def create_order(order: OrderCreate) -> dict[str, int | str]:
    if not any(product["id"] == order.product_id for product in PRODUCTS):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return {"status": "created", "product_id": order.product_id, "quantity": order.quantity}


@app.get("/compute", tags=["experiments"])
def compute(
    iterations: int = Query(default=100_000, ge=10_000, le=1_000_000),
) -> dict[str, int]:
    """Perform bounded CPU work for controlled local load tests only."""

    checksum = 0
    for value in range(iterations):
        checksum = (checksum + value * value) % 1_000_003
    return {"iterations": iterations, "checksum": checksum}


@app.get("/metrics", include_in_schema=False)
def metrics() -> Response:
    """Expose Prometheus metrics without redirecting the scrape endpoint."""

    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

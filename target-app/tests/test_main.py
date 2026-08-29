from fastapi.testclient import TestClient

from target_app.main import app


def test_health_and_products() -> None:
    with TestClient(app) as client:
        assert client.get("/health").json() == {"status": "ok"}
        assert len(client.get("/products").json()) == 3


def test_order_and_compute() -> None:
    with TestClient(app) as client:
        order = client.post("/orders", json={"product_id": 1, "quantity": 2})
        compute = client.get("/compute?iterations=10000")

    assert order.status_code == 201
    assert compute.status_code == 200
    assert compute.json()["iterations"] == 10_000


def test_metrics_are_exposed() -> None:
    with TestClient(app) as client:
        client.get("/health")
        metrics = client.get("/metrics")

    assert metrics.status_code == 200
    assert "demo_target_http_requests_total" in metrics.text

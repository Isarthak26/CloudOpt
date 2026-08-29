from fastapi.testclient import TestClient

from app.main import app


def test_health_checks_database() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_products_and_orders_flow() -> None:
    with TestClient(app) as client:
        products = client.get("/products")
        assert products.status_code == 200
        first_product = products.json()[0]

        order = client.post("/orders", json={"product_id": first_product["id"], "quantity": 2})
        assert order.status_code == 201
        assert order.json()["quantity"] == 2

        orders = client.get("/orders")
        assert orders.status_code == 200
        assert orders.json()[0]["id"] == order.json()["id"]


def test_compute_is_bounded() -> None:
    with TestClient(app) as client:
        response = client.get("/compute?iterations=10000")

    assert response.status_code == 200
    assert response.json()["iterations"] == 10_000


def test_unknown_product_returns_not_found() -> None:
    with TestClient(app) as client:
        response = client.get("/products/9999")

    assert response.status_code == 404

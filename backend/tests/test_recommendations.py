from fastapi.testclient import TestClient

from app.main import app


def test_experiment_dataset_returns_nine_rows() -> None:
    with TestClient(app) as client:
        response = client.get("/experiments/dataset")

    assert response.status_code == 200
    payload = response.json()
    assert payload["row_count"] == 9
    assert len(payload["rows"]) == 9
    assert {row["load_level"] for row in payload["rows"]} == {"low", "medium", "high"}
    assert {row["config_label"] for row in payload["rows"]} == {
        "unconstrained",
        "cpu_1_mem_512",
        "cpu_0.25_mem_128",
    }


def test_recommendation_for_high_load() -> None:
    with TestClient(app) as client:
        response = client.get("/recommendations/high")

    assert response.status_code == 200
    payload = response.json()
    assert payload["load_level"] == "high"
    assert payload["recommended_config"] == "cpu_1_mem_512"
    assert payload["cpu_limit"] == 1.0
    assert payload["memory_limit_mb"] == 512.0
    rejected_labels = {item["config_label"] for item in payload["rejected_configs"]}
    assert rejected_labels == {"cpu_0.25_mem_128"}
    assert "275.87" in payload["rejected_configs"][0]["reason"]
    assert "cpu_0.25_mem_128" in payload["reasoning"]


def test_recommendation_comparison() -> None:
    with TestClient(app) as client:
        response = client.get("/recommendations/comparison")

    assert response.status_code == 200
    payload = response.json()
    assert "unconstrained" in payload["naive_strategy"]
    by_load = {item["load_level"]: item for item in payload["comparisons"]}
    assert set(by_load) == {"low", "medium", "high"}
    assert by_load["low"]["recommended_config_label"] == "cpu_0.25_mem_128"
    assert by_load["medium"]["recommended_config_label"] == "cpu_0.25_mem_128"
    assert by_load["high"]["recommended_config_label"] == "cpu_1_mem_512"
    for item in payload["comparisons"]:
        assert item["naive_config_label"] == "unconstrained"
        assert item["recommended_uses_fewer_resources"] is True


def test_invalid_load_level_returns_400() -> None:
    with TestClient(app) as client:
        response = client.get("/recommendations/spike")

    assert response.status_code == 400
    assert "Invalid load_level" in response.json()["detail"]

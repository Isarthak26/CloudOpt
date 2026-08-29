# CloudOpt demo target application

This is a small, independent application for CloudOpt AI to observe. It is **not** the CloudOpt AI backend or dashboard.

It provides predictable API traffic, a bounded CPU-work endpoint, and Prometheus metrics. Its purpose is to be containerized locally and later monitored by Prometheus.

## Endpoints

- `GET /health` — service health
- `GET /products` — fixed sample products
- `POST /orders` — accepts an example order
- `GET /compute?iterations=100000` — bounded CPU work for controlled tests
- `GET /metrics` — Prometheus metrics

## Run locally without Docker

```bash
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn target_app.main:app --reload --port 8080
```

## Build and run with Docker

After Docker Desktop is running:

```bash
docker build -t cloudopt-demo-target .
docker run --name cloudopt-demo-target --rm -p 8080:8080 cloudopt-demo-target
```

Then open `http://127.0.0.1:8080/docs`.

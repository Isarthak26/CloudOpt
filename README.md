# CloudOpt AI

CloudOpt AI is a student project investigating data-driven cloud resource recommendations using controlled application experiments. The full project scope and sequencing are in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Current milestone

Phase 1 provides a small, database-backed FastAPI application, and the local monitoring stack now includes Dockerized target-app, Prometheus, and Grafana. It deliberately does **not** yet include load generation, ML, Kubernetes, Azure, CI/CD, or a frontend.

The separate [`target-app/`](target-app/) directory contains the small local workload application that CloudOpt AI will later observe. It is intentionally independent from the CloudOpt backend/dashboard.

## Local setup

1. Create a PostgreSQL database and user for local development.
2. From `backend/`, create and activate a Python virtual environment.
3. Install dependencies: `pip install -r requirements.txt`.
4. Copy `../.env.example` to `../.env`, then set `DATABASE_URL` to the local PostgreSQL connection string.
5. Run: `uvicorn app.main:app --reload`.
6. Open `http://127.0.0.1:8000/docs` to try the API.

To run the automated tests from `backend/`, use `pytest`.

## Phase 1 API

- `GET /health`
- `GET /products`
- `GET /products/{product_id}`
- `POST /orders`
- `GET /orders`
- `GET /compute?iterations=100000`

`/compute` is intentionally bounded and exists only to create controlled CPU work for the later experiment phase.

## Local monitoring stack

The Docker Compose stack runs the independent target application on port `8080` and Prometheus on port `9090`. Prometheus scrapes the target application's `/metrics` endpoint every five seconds.

Grafana is available at `http://127.0.0.1:3000`. Log in with the admin user and the password from your local `.env` file (`GRAFANA_ADMIN_PASSWORD`). The Prometheus datasource and starter dashboard are provisioned automatically on first run.

```bash
docker compose up --build -d
```

Open `http://127.0.0.1:9090/targets` to confirm that `cloudopt-demo-target` is **UP**. A useful first query in the Prometheus UI is:

```text
demo_target_http_requests_total
```

Stop the monitoring stack when finished:

```bash
docker compose down
```

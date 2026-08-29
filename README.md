# CloudOpt AI

CloudOpt AI is a student project for measuring application workloads, comparing resource configurations, and building toward data-driven cloud resource recommendations.

[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-blue)](https://www.python.org/)

## About

CloudOpt AI separates a small monitored application from the CloudOpt backend so the project can observe real request traffic, collect metrics, and study controlled load experiments without mixing concerns. The repo currently focuses on a local-first workflow with FastAPI, PostgreSQL, Docker, Prometheus, Grafana, and k6. The goal is to build a defensible foundation for later experiment comparison and lightweight recommendation work.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Status / Roadmap](#project-status--roadmap)
- [Contributing](#contributing)
- [License](#license)

## Architecture Overview

CloudOpt AI is split into three practical parts:

- `backend/` — the CloudOpt FastAPI application that serves the main project API and connects to PostgreSQL.
- `target-app/` — a separate FastAPI workload that exposes predictable endpoints for monitoring and load testing.
- Local monitoring stack — Prometheus scrapes the target app, and Grafana reads from Prometheus using provisioned datasource and dashboard files.

In the current local setup, the target app serves traffic on port `8080`, Prometheus on `9090`, and Grafana on `3000`.

## Tech Stack

- Python
- FastAPI
- PostgreSQL
- Docker
- Docker Compose
- Prometheus
- Grafana
- k6
- Pandas / scikit-learn are planned for later phases only

## Getting Started

### Prerequisites

- Python 3.12 or newer
- PostgreSQL for the CloudOpt backend
- Docker Desktop or a compatible Docker Engine setup
- k6 for load testing (see [load-tests/README.md](load-tests/README.md) for install links)

### Installation

1. Create a PostgreSQL database and user for local development.
2. From `backend/`, create and activate a Python virtual environment.
3. Install backend dependencies.

```bash
cd backend
pip install -r requirements.txt
```

4. Copy the example environment file and set your local database URL.

```bash
cp ../.env.example ../.env
```

5. Update `DATABASE_URL` in `.env` so it points to your local PostgreSQL instance.
6. Start the CloudOpt backend.

```bash
uvicorn app.main:app --reload
```

7. Open the API docs at `http://127.0.0.1:8000/docs`.

### Running the Monitoring Stack

Start the target app, Prometheus, and Grafana with Docker Compose:

```bash
docker compose up --build -d
```

Stop the monitoring stack when you are finished:

```bash
docker compose down
```

## Usage

### Phase 1 API

The CloudOpt backend currently exposes these endpoints:

- `GET /health`
- `GET /products`
- `GET /products/{product_id}`
- `POST /orders`
- `GET /orders`
- `GET /compute?iterations=100000`

`/compute` is intentionally bounded and exists to create controlled CPU work for later experiment phases.

### Monitoring Stack

- Target app: http://127.0.0.1:8080
- Target app metrics: http://127.0.0.1:8080/metrics
- Prometheus targets: http://127.0.0.1:9090/targets
- Grafana: http://127.0.0.1:3000

Grafana uses the admin password from your local `.env` file (`GRAFANA_ADMIN_PASSWORD`). The Prometheus datasource and starter dashboard are provisioned automatically on first run.

### Load Testing

The `load-tests/` folder contains staged k6 profiles and a small analyzer for baseline result files.

Run the profiles from the repository root:

```bash
k6 run load-tests/k6/scripts/low_load.js
k6 run load-tests/k6/scripts/medium_load.js
k6 run load-tests/k6/scripts/high_load.js
```

Summarize the saved JSON results:

```bash
python3 load-tests/analyze_results.py
```

The analyzer reads files from `load-tests/results/` and writes a Markdown summary to `load-tests/results/baseline_summary.md`.

## Project Status / Roadmap

- [x] Phase 0 — Repository and architecture groundwork
- [x] Phase 1 — Measurable local application
- [x] Phase 2 — Local metrics and observability
- [ ] Phase 3 — Controlled experiments and result capture
  - k6 profiles and baseline summary tooling exist; broader experiment dataset work is still ongoing.
- [ ] Phase 4 — Dataset and simple ML
- [ ] Phase 5 — Baseline comparison
- [ ] Phase 6 — Azure and infrastructure as code
- [ ] Phase 7 — CI/CD and cloud validation
- [ ] Phase 8 — React dashboard and final evaluation

## Contributing

This is a personal academic project and is not currently accepting external contributions.

## License

No license file has been added to this repository yet.

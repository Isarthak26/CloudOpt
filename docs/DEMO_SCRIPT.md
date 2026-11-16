# CloudOpt AI — Evaluation Demo Script

Target duration: **7–8 minutes**, followed by questions.

**Live dashboard:** https://cloudopt-ai-tau.vercel.app

## Before the evaluation

1. Install backend, ML, target-app, and frontend dependencies.
2. Run both Python test suites, frontend lint, and frontend build.
3. Open the Vercel deployment and verify the green **Backend connected** badge.
4. Keep the local backend/frontend commands ready only as a fallback.
5. If demonstrating monitoring, start Docker Compose and verify Prometheus targets before the session.
6. Keep this script, `docs/EVALUATION_PACK.md`, and the dashboard open in separate tabs.

## Start commands

Terminal 1, from the repository root:

```bash
DATABASE_URL=sqlite:///./.cloudopt-dev.db \
  .venv/bin/uvicorn app.main:app --app-dir backend --reload
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Optional monitoring stack, Terminal 3:

```bash
docker compose up --build -d
```

## Presentation flow

### 0:00–0:45 — Problem and bounded claim

Say:

> Static resource allocation can waste capacity or cause latency under load. CloudOpt uses controlled local measurements to recommend the smallest already-tested configuration that meets a defined performance boundary. This MVP is decision support: it does not autonomously change infrastructure, and its current selector is transparent rather than a trained ML model.

### 0:45–1:30 — Architecture

Show the architecture diagram in `docs/EVALUATION_PACK.md`.

Emphasize:

- k6 drives a separate measurable target app.
- Prometheus and Grafana provide operational telemetry.
- Frozen k6 summaries become a canonical CSV.
- FastAPI exposes one authoritative recommendation implementation to React.

### 1:30–2:15 — Working health and API

Open:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`

Show that the API and database are healthy. Briefly point out the dataset, recommendation, comparison, product/order, and bounded-compute routes.

### 2:15–3:15 — Dashboard overview

Open `https://cloudopt-ai-tau.vercel.app/`.

Point out:

- 9 measured runs, 3 resource profiles, and 0% measured request failures.
- The high-load decision: 1 CPU / 512 MB at p95 11.40 ms.
- The green backend connection status.

### 3:15–4:15 — Recommendation logic

Open **Recommendations** and select low, medium, then high.

Say:

> A configuration qualifies only if p95 is at most 50 ms and failures are zero. The smallest qualified CPU, then memory, is selected.

At high load, show:

- 1 CPU / 512 MB is selected.
- 0.25 CPU / 128 MB is rejected at p95 275.87 ms.
- The API returns the complete decision trace rather than only a label.

### 4:15–5:00 — Baseline comparison

Open **Comparison**.

Explain that the naive baseline always deploys unconstrained resources. For all three load levels, the recommendation uses a lower finite allocation while both sides remain within the SLO. State clearly that this is retrospective analysis of already-measured runs, not a new paired redeployment.

### 5:00–5:45 — Evidence and methodology

Open **Experiment data** and show the nine rows. Highlight the high-load small-profile row marked **Over SLO**.

Open **Methodology** and show:

- The explicit decision rule.
- What the project does not claim.
- The Vercel evaluation deployment is complete; the authenticated AKS/EKS experiment runner remains next work.

### 5:45–6:30 — Tests

Show the validation record or run:

```bash
.venv/bin/python -m pytest -q
```

Expected result: all 22 Python tests pass. Mention that frontend lint and production build also pass.

### 6:30–7:30 — Limitations and remaining work

Finish with the strongest honest limitations:

- One canonical run per cell; repetitions are needed.
- Comparison is retrospective; paired runs are needed.
- One small local application cannot establish production generalization.
- No trained model, Azure validation, or exact cost saving is claimed.
- Stakeholder feedback still needs to be collected with the prepared protocol.

Then show the prioritized remaining-work list.

## Likely questions and concise answers

**Why call it AI if there is no trained model?**
The current milestone validates the measurement and decision pipeline with an explainable selector. A learned model is future work only after collecting enough repeated and diverse data. The current presentation should call it AI-assisted/project groundwork, not claim a trained AI result.

**Why is the decision threshold 50 ms while k6 scripts contain larger thresholds?**
The k6 thresholds are broad run-health guardrails for different traffic scripts. The 50 ms value is the stricter configuration-selection SLO applied consistently to the canonical dataset.

**How do you know the recommendation saves cost?**
The current evidence proves a lower finite allocation than an unconstrained policy, not a currency saving. Exact cost claims require a finite baseline, provider pricing, and cloud validation.

**Why was the smallest profile rejected at high load with no HTTP failures?**
Availability alone is insufficient. Its p95 latency rose to 275.87 ms, far beyond the 50 ms decision SLO, and it completed fewer requests than the other high-load profiles.

**Is the comparison fair?**
It compares cells from the same frozen experiment grid, but it is retrospective and contains one run per cell. Fresh alternating paired runs with repetitions are the next evidence improvement.

**Where is the database used?**
SQLAlchemy/PostgreSQL supports the application product/order workflow. The frozen experiment evidence is currently file-based for auditability at this small scale.

## Fallback if a live service fails

Use the screenshots in `docs/evidence/`, then show the saved JSON, canonical CSV, comparison report, and passing test output. Do not hide a failure; explain whether it is a demo-environment issue or a product defect.

# CloudOpt AI — Project Context

**Project:** AI-Assisted Cloud Resource Optimization (CloudOpt AI)  
**Owner:** Sarthak Bordia  
**Programme:** B.Tech CSE (DevOps Specialization)  
**Primary domain:** Cloud Computing  
**Focus:** Cloud-native DevOps and applied machine learning

> This document is the working specification for the project. Read it before proposing or making material project changes. It describes the intended scope, sequencing, and constraints; it is not permission to build every component at once.

## 1. Problem statement and motivation

Cloud applications are often deployed with inefficient resource allocations. Over-provisioning CPU, memory, and replicas creates avoidable infrastructure cost and unused capacity. Under-provisioning causes latency increases, failed requests, and reduced availability under load. Because workloads change over time, a static configuration that was reasonable at deployment can later become wasteful or inadequate.

Most small teams address this manually: inspect monitoring dashboards, estimate an appropriate configuration, redeploy, and repeat. This project investigates a more data-driven workflow: collect workload and performance metrics, evaluate resource configurations under controlled load, and recommend a configuration that balances performance with allocated resources.

The project matters to:

- Organizations, especially startups and small teams, operating within limited cloud budgets.
- DevOps/cloud engineers responsible for availability, performance, and cost.
- Application users affected by slow responses or failed requests during insufficient capacity.
- Variable-workload services whose infrastructure needs cannot be captured well by one fixed setting.

The primary SDG alignment is **SDG 9 — Industry, Innovation and Infrastructure**. A secondary alignment is **SDG 12 — Responsible Consumption and Production**, through reducing unnecessary compute allocation. Do not claim direct carbon or energy impact unless it is measured.

## 2. Scope and honest ML positioning

CloudOpt AI is a cloud resource **decision-support and experiment platform**, not a production-grade autonomous cloud optimizer. Its core question is:

> Given a measured workload and a set of tested configurations, which configuration best meets defined performance constraints with lower allocated resources or estimated cost?

The ML component must remain modest, reproducible, and defensible:

- Use data generated from controlled experiments; do not claim broad real-world generalization from a small student dataset.
- Start with a configuration recommendation/classification approach, choosing among a small set of tested CPU, memory, and replica configurations.
- Regression models may be explored later for workload, latency, or resource-demand prediction only when data quantity and quality justify them.
- Compare the ML approach with transparent heuristic/rule-based and static baselines.
- Present recommendations with their input metrics, evaluated constraints, evidence from experiments, and confidence/limitations where meaningful.
- Do not claim that the system autonomously operates production infrastructure, guarantees savings, eliminates outages, or replaces engineering judgement.

## 3. End-to-end architecture

```text
                     React + Tailwind dashboard
                                |
                                v
                         FastAPI backend API
                    /           |             \
                   v            v              v
            PostgreSQL    ML/recommendation   Prometheus
            experiments       service/model         |
                   |                                v
                   +--------------------------> Grafana

Application workload --> FastAPI application --> /metrics
   (k6 or Locust)             |                    |
                              v                    v
                         PostgreSQL          Prometheus scrape

Local Docker Compose first; later:
GitHub Actions --> Docker image --> Azure Container Registry --> AKS
Terraform provisions Azure infrastructure; Kubernetes manifests set resources.
```

### Responsibilities

- **Sample application / FastAPI:** provides a realistic, measurable API workload (for example products, orders, and a controlled CPU-intensive endpoint).
- **PostgreSQL:** stores application data, experiment metadata/results, and recommendation records as needed.
- **Prometheus:** scrapes application and infrastructure metrics, including requests, latency, errors, CPU, memory, and pod information where available.
- **Grafana:** provides monitoring dashboards, particularly during early development and experiments.
- **Experiment runner:** uses k6 or Locust to produce repeatable, short controlled workloads.
- **Data/ML layer:** cleans experiment results with Pandas, trains simple scikit-learn models, and produces explainable recommendations among tested configurations.
- **React dashboard:** is a custom project interface over the backend, experiments, metrics, recommendations, and deployment information. It complements—not replaces—Grafana.
- **Docker and Docker Compose:** support reproducible local development before cloud deployment.
- **Terraform/Azure/AKS/ACR:** are introduced after the complete local workflow has been demonstrated.
- **Git/GitHub/GitHub Actions:** provide version control and a tested build/deploy pipeline.

## 4. Technology stack

| Area | Intended technology |
|---|---|
| Backend/application API | Python, FastAPI |
| Application and experiment storage | PostgreSQL |
| Containers/local orchestration | Docker, Docker Compose |
| Source control and CI/CD | Git, GitHub, GitHub Actions |
| Infrastructure as code | Terraform |
| Cloud platform | Microsoft Azure |
| Container registry and Kubernetes | Azure Container Registry (ACR), Azure Kubernetes Service (AKS) |
| Monitoring | Prometheus, Grafana |
| Load testing | k6 and/or Locust |
| Data/ML | Python, Pandas, scikit-learn |
| Custom web UI | React, Tailwind CSS |

## 5. Project flow

Build and validate the project from the inside out:

```text
Application
  -> Metrics
  -> Controlled experiments
  -> Dataset
  -> ML/recommendation
  -> Baseline comparison
  -> Azure deployment
  -> CI/CD
  -> Custom dashboard
```

Detailed loop:

1. A FastAPI application receives a defined workload.
2. Prometheus collects application and available infrastructure metrics.
3. An experiment records the workload, resource configuration, and measured outcomes.
4. Results are exported/assembled into a clean dataset.
5. A simple ML or transparent selection method recommends one of the tested configurations.
6. The recommended configuration is run under the *same* workload.
7. Its outcomes are compared against a fixed/static baseline using predefined thresholds.
8. After local validation, the system is deployed to Azure using Terraform, ACR, AKS, and Kubernetes manifests.
9. GitHub Actions runs tests, builds images, and deploys through an appropriate controlled pipeline.
10. The React dashboard presents the project data and recommendations.

## 6. ML approach and evaluation

### Initial approach

Begin with a finite configuration set, such as combinations of:

- CPU request/limit
- Memory request/limit
- Replica count

For each workload level, label acceptable configurations using performance constraints (for example, acceptable latency and error-rate thresholds). Choose the lowest-resource or lowest estimated-cost acceptable configuration. A classifier can then recommend a configuration based on workload and recent metrics. A transparent scoring/rule baseline must be retained.

Potential features include request rate, latency percentiles, error rate, CPU utilization, memory utilization, current replicas, and current resource allocation. Outputs may be a configuration label or a ranked list of tested configurations.

### Later optional models

If the dataset supports it, evaluate simple regression for expected latency/resource demand or lightweight time-series-style workload forecasting. These are optional extensions, not required for the MVP.

### Evaluation

Evaluate both model behavior and system outcomes:

- Train/test split or cross-validation appropriate to dataset size; avoid leakage between repetitions of the same experiment.
- For classification: accuracy, precision/recall or macro F1, plus confusion matrix where useful.
- For regression (only if used): MAE/RMSE and comparison to a simple baseline.
- For the system: p50/p95 latency, throughput, error rate, CPU/memory utilization, allocated resources, replica count, and estimated cost.
- Report limitations: small controlled dataset, one demonstration application, short test windows, and unmeasured external production factors.

## 7. Baseline-versus-AI experiment design

The experiment, not the model label, is the core evidence of the project.

1. Define several workload levels, e.g. low, medium, and high request rates.
2. Define a small grid of resource configurations, e.g. 2–4 configurations varying CPU, memory, and replicas.
3. Run each workload/configuration combination repeatedly for a short fixed duration with warm-up where feasible.
4. Record configuration, workload profile, start/end time, latency, throughput, errors, CPU, memory, replica count, and estimated cost/resource score.
5. Select a **static baseline** configuration that represents ordinary fixed provisioning.
6. Generate a recommendation from the ML/selection method for the same workload.
7. Run baseline and recommendation under equivalent conditions, preferably with repetitions and alternating run order to reduce bias.
8. Compare performance and cost/resource outcomes against explicit acceptance constraints.

The final claim should be bounded, for example: *within this controlled environment and tested workloads, the recommendation selected a lower-allocation configuration while keeping latency and error rate within the stated thresholds.*

## 8. Custom dashboard pages

The planned UI information architecture is:

- **Overview:** high-level workload, utilization, health, estimated cost/resource score, and latest recommendation.
- **Live Metrics:** current/prometheus-backed request, latency, error, CPU, memory, and pod charts.
- **Resource Analysis:** allocations versus utilization, trend analysis, and potential under/over-provisioning evidence.
- **AI Recommendation:** recommended tested configuration, rationale, inputs, confidence/limitations, and expected comparison—not unsupported automation.
- **Experiments:** workload profiles, resource configurations, run status, and saved experiment results.
- **Comparison:** static baseline versus recommendation across latency, errors, throughput, utilization, and estimated cost/resource score.
- **Deployments:** deployment history/status and CI/CD stages relevant to the demonstration.
- **Settings:** controlled configuration, thresholds, and environment settings. Sensitive values must never be exposed to the UI.

MVP UI priority: Overview, Resource Analysis, AI Recommendation, Experiments, Comparison, and Deployments. Build the frontend after the underlying data flows are reliable.

## 9. Phased implementation plan

### Phase 0 — Repository and architecture

Create the repository, documentation, development conventions, and a reviewed architecture plan. Do not pre-create every future folder or service.

### Phase 1 — Measurable local application

Build the FastAPI foundation, health endpoint, a small realistic API surface, PostgreSQL integration, tests, and one controlled CPU-intensive endpoint.

### Phase 2 — Metrics and local observability

Expose `/metrics`, run Prometheus and Grafana locally, and validate request, latency, error, CPU, and memory visibility.

### Phase 3 — Containers and controlled experiments

Dockerize the application; run FastAPI, PostgreSQL, Prometheus, and Grafana via Docker Compose. Add k6/Locust workload scripts and persist/export experiment data.

### Phase 4 — Dataset and simple ML

Clean the dataset using Pandas; establish a transparent baseline; train/evaluate a small scikit-learn model or configuration selector; generate explainable recommendations.

### Phase 5 — Baseline comparison

Run comparable static-baseline and recommended-configuration experiments; record results and limitations.

### Phase 6 — Azure and infrastructure as code

Use Terraform to provision only the Azure resources justified by the validated local system (resource group, networking as needed, ACR, AKS, and database approach). Deploy using Kubernetes manifests with explicitly varied resource settings.

### Phase 7 — CI/CD and cloud validation

Add GitHub Actions for linting/tests, image build, image push to ACR, and controlled deployment to AKS. Run limited cloud experiments within credits.

### Phase 8 — React dashboard and final evaluation

Build the dashboard over established APIs and results, refine documentation, produce final comparisons, and prepare a clear demonstration of limitations and findings.

## 10. First-week milestone

The first week is intentionally narrow. The target is a locally working, observable foundation—not Kubernetes, Azure, ML, or a polished frontend.

| Day | Outcome |
|---|---|
| 1 | Initialize Git/GitHub, Python environment, FastAPI skeleton, PostgreSQL plan, `GET /health`. |
| 2 | Add a small products/orders-style API and persist data in PostgreSQL. |
| 3 | Instrument request count, latency, and errors; expose `/metrics`. |
| 4 | Dockerize the service and obtain a working local Docker Compose stack. |
| 5 | Add Prometheus and Grafana; verify basic charts. |
| 6 | Add k6 or Locust scripts; run short low/medium/high controlled loads. |
| 7 | Export/save the first experiment dataset, inspect it, and decide the precise first prediction/recommendation target. |

**Week-one completion evidence:** health endpoint, database-backed API, metrics endpoint, reproducible local stack, observable workload, an initial experiment CSV/table, and tests/documentation for what exists.

## 11. Target repository structure (evolve as needed)

```text
cloudopt-ai/
├── PROJECT_CONTEXT.md
├── README.md
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── database/
│   │   ├── models/
│   │   ├── services/
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt or pyproject.toml
│   └── Dockerfile
├── frontend/                 # React + Tailwind; add in later phase
├── ml/
│   ├── data/                 # tracked small samples only; ignore large/raw data
│   ├── notebooks/
│   ├── train.py
│   ├── predict.py
│   └── models/               # artifacts managed deliberately
├── experiments/
│   ├── workloads/
│   ├── scripts/
│   └── results/
├── monitoring/
│   ├── prometheus/
│   └── grafana/
├── kubernetes/
├── infrastructure/
│   └── terraform/
├── .github/
│   └── workflows/
├── docker-compose.yml
└── .gitignore
```

This is a target map, not a directive to generate the entire tree at the start. Add directories and configuration only when their phase begins.

## 12. Constraints and non-goals

- Azure student credits are limited: use small resources, shut down/delete unused cloud resources promptly, and confirm cost implications before provisioning.
- Use short, controlled load tests; do not run uncontrolled or prolonged tests against shared/public systems.
- Prefer simple, explainable ML over complex models with insufficient data.
- Treat estimated cost as a clearly documented estimate or relative resource score unless an accurate pricing method and assumptions are included.
- Keep secrets out of the repository and frontend; use environment variables and GitHub/Azure secret stores where applicable.
- No production-grade multi-tenancy, autonomous scaling controller, broad cloud-provider support, or real enterprise cost-management claims are required for the project.
- Grafana is suitable for monitoring; the custom dashboard must focus on project-specific analysis and recommendations.
- Maintain reproducibility: version workload scripts, configurations, dataset schema, and experiment metadata.

## 13. Instructions for Codex and contributors

1. **Work incrementally.** Treat every phase as a small engineering milestone with a clear definition of done.
2. **Inspect the repository first.** Before changing code, identify the current structure, existing conventions, tests, and uncommitted user work.
3. **Explain architecture before major implementation.** For a new subsystem (database, monitoring, ML, Docker, Kubernetes, Terraform, frontend, CI/CD), first describe its purpose, interfaces, files, data flow, and trade-offs; wait for approval when the change is material.
4. **Do not build the whole project at once.** Never generate future-phase infrastructure, Kubernetes, Azure, ML, or UI work merely because it appears in this document.
5. **Keep scope proportional.** Prefer the smallest solution that proves the current milestone. Avoid unnecessary services, frameworks, abstractions, queues, caches, microservices, advanced MLOps, or premature automation.
6. **Test what changes.** Run relevant tests and validation after implementation; report what was verified and any limitations. Add tests when they are proportionate to the code added.
7. **Preserve understanding.** Explain decisions in plain language so Sarthak can describe the system in a review, interview, or viva.
8. **Be honest in documentation and UI.** State assumptions, data limits, and metrics definitions. Never overstate AI capability, savings, reliability, or production readiness.
9. **Protect cost and safety.** Before Azure provisioning or resource-changing automation, surface expected resources, cost risks, rollback/cleanup plan, and required credentials.
10. **Do not modify unrelated work.** Keep commits/changes focused on the requested milestone and avoid destructive repository actions.

## 14. Immediate next step

Do not implement the project from this document automatically. The next planned interaction is an **inspection and architecture discussion for Phase 1**: FastAPI + PostgreSQL + Prometheus instrumentation locally, starting with the minimum application foundation.

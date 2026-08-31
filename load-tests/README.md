# k6 Load Tests

These scripts generate controlled traffic against the local `target-app` so you can observe the system in Grafana while k6 records its own client-side results.

## Prerequisites

Make sure the local monitoring stack is already running before starting a test:

```bash
docker compose up -d
```

That should leave the following services available:

- target app: http://127.0.0.1:8080
- Prometheus: http://127.0.0.1:9090
- Grafana: http://127.0.0.1:3000

## Install k6

Use the official installation docs for your operating system. Do not assume a specific package manager.

- macOS: https://grafana.com/docs/k6/latest/set-up/install-k6/
- Windows: https://grafana.com/docs/k6/latest/set-up/install-k6/
- Linux: https://grafana.com/docs/k6/latest/set-up/install-k6/

## Before every measured run

Follow this sequence before collecting any baseline, constrained, or future-config measurement so the run is warmed up and comparable:

1. Restart the stack fresh:

```bash
docker compose down && docker compose up -d --build
```

2. Run the warmup script and let it finish completely:

```bash
k6 run load-tests/k6/scripts/warmup.js
```

3. Only after warmup completes, run the measured profile you want:

```bash
k6 run load-tests/k6/scripts/low_load.js
k6 run load-tests/k6/scripts/medium_load.js
k6 run load-tests/k6/scripts/high_load.js
```

This applies to every config under test so comparisons stay fair. Any results collected before this warmup procedure existed, including the original baseline set, should be treated as invalid for baseline-vs-improved comparison and re-run cleanly using the new workflow.

## Run the load profiles

Run each profile from the repository root so the result files land in `load-tests/results/`:

```bash
k6 run load-tests/k6/scripts/low_load.js
k6 run load-tests/k6/scripts/medium_load.js
k6 run load-tests/k6/scripts/high_load.js
```

Each run writes a timestamped JSON summary to:

```text
load-tests/results/<profile>_<timestamp>.json
```

## Frozen 3-config experiment (Phase 4)

`analyze_results.py` still groups every JSON file in `load-tests/results/` by profile name only. Do not treat `baseline_summary.md` as the experiment dataset.

The canonical comparison is the warmed-up 3×3 grid frozen in `ml/canonical_runs.json` and assembled into `ml/data/experiment_dataset.csv`:

| config_label | Compose limits | Filename family |
|---|---|---|
| `unconstrained` | no cpu/memory limits | `*_baseline_v2_*` |
| `cpu_1_mem_512` | 1.0 CPU / 512 MB | `*_constrained_v2_*` |
| `cpu_0.25_mem_128` | 0.25 CPU / 128 MB | `*_stress_v1_*` |

The first unlabeled JSON set is invalid (cold start). Extra `*_improved_*` and `*_baseline2_*` files are not in the frozen set.

Process-level Prometheus samples for the `stress_v1` high-load window are saved in `ml/data/prometheus_stress_v1_high_load.json`. RSS stayed well below 128 MB. Mean process CPU was about 0.19 cores and the 30s CPU rate peaked near 0.24 cores against a 0.25 CPU limit. That is supporting evidence of CPU quota pressure, not cgroup-level proof (no cAdvisor metrics).

## What to watch during a run

Keep Grafana open while the test is running:

- http://127.0.0.1:3000

The provisioned dashboard shows request rate, latency, and error rate for the target app, which makes the ramp-up / hold / ramp-down curve easy to see.

## Profiles

- `low_load.js` — about 5 VUs, intended for a short baseline load check.
- `medium_load.js` — about 20 VUs, intended to represent moderate local traffic.
- `high_load.js` — about 50 VUs, intended to stress the target app more aggressively without changing the monitoring stack.

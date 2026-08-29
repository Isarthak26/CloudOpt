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

## What to watch during a run

Keep Grafana open while the test is running:

- http://127.0.0.1:3000

The provisioned dashboard shows request rate, latency, and error rate for the target app, which makes the ramp-up / hold / ramp-down curve easy to see.

## Profiles

- `low_load.js` — about 5 VUs, intended for a short baseline load check.
- `medium_load.js` — about 20 VUs, intended to represent moderate local traffic.
- `high_load.js` — about 50 VUs, intended to stress the target app more aggressively without changing the monitoring stack.

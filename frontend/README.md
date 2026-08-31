# CloudOpt AI Dashboard (Phase 8)

A small React + Vite dashboard that visualizes the CloudOpt AI experiment data
and the recommendations produced by `ml/`. It is read-only: every number comes
from the backend API, and none of the selector logic is duplicated here.

## Pages

- **Overview** — what the project does, plus headline stats derived from the live dataset.
- **Recommendations Explorer** — pick low/medium/high load and see the recommended config, its measured p95 and failure rate, which configs were eligible, and why the others were rejected.
- **Baseline Comparison** — naive "always unconstrained" vs the selector, as a table and a bar chart.
- **Experiment Data** — the nine measured runs as a sortable table, plus the p95-vs-load line chart.
- **Methodology** — static summary of the approach, roadmap, and limitations.

## Prerequisites

- Node.js `^20.19.0 || >=22.12.0` (required by Vite 8)
- The CloudOpt backend running on port 8000:

  ```bash
  cd backend
  uvicorn app.main:app --reload
  ```

## Install

```bash
cd frontend
npm install
```

## Run

```bash
npm run dev
```

Then open the URL Vite prints (http://localhost:5173 by default).

## Configuration

The API base URL comes from `src/config.js`. In `npm run dev` it is empty and
`vite.config.js` proxies `/experiments`, `/recommendations` and `/health` to
`http://127.0.0.1:8000`, so requests stay same-origin and the backend needs no
CORS changes. Override either value in `frontend/.env`:

```bash
# where the dev server proxies backend routes
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
# or bypass the proxy entirely and call the API directly (needs CORS on the backend)
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Build (optional for a local demo)

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## Backend unavailable

Every page handles the backend being down: the data pages show
"Could not reach the backend …" instead of a blank screen, and the Overview page
falls back to the frozen headline figures with the same warning.

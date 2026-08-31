"""Build experiment_dataset.csv from the frozen k6 result files (Phase 4)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parent
MANIFEST_PATH = ROOT / "canonical_runs.json"
RESULTS_DIR = REPO_ROOT / "load-tests" / "results"
OUTPUT_PATH = ROOT / "data" / "experiment_dataset.csv"

DATASET_COLUMNS = [
    "config_label",
    "cpu_limit",
    "memory_limit_mb",
    "load_level",
    "vus",
    "total_requests",
    "avg_latency_ms",
    "p95_latency_ms",
    "http_req_failed_rate",
]


def _summary_metrics(payload: dict[str, Any]) -> dict[str, Any]:
    summary = payload.get("summary")
    if isinstance(summary, dict):
        return summary.get("metrics", {})
    return payload.get("metrics", {})


def _metric_value(metrics: dict[str, Any], name: str, key: str) -> float | int | None:
    values = metrics.get(name, {}).get("values", {})
    value = values.get(key)
    if isinstance(value, (int, float)):
        return value
    return None


def extract_run_metrics(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    metrics = _summary_metrics(payload)
    duration = metrics.get("http_req_duration", {}).get("values", {})

    vu_count = (
        _metric_value(metrics, "vus_max", "max")
        or _metric_value(metrics, "vus", "max")
        or _metric_value(metrics, "vus_max", "value")
        or _metric_value(metrics, "vus", "value")
    )
    total_requests = _metric_value(metrics, "http_reqs", "count")
    failed_rate = _metric_value(metrics, "http_req_failed", "rate")
    avg_ms = duration.get("avg") if isinstance(duration.get("avg"), (int, float)) else None
    p95_ms = duration.get("p(95)") if isinstance(duration.get("p(95)"), (int, float)) else None

    return {
        "vus": int(vu_count) if vu_count is not None else None,
        "total_requests": int(total_requests) if total_requests is not None else None,
        "avg_latency_ms": float(avg_ms) if avg_ms is not None else None,
        "p95_latency_ms": float(p95_ms) if p95_ms is not None else None,
        "http_req_failed_rate": float(failed_rate) if failed_rate is not None else None,
    }


def assemble(manifest_path: Path = MANIFEST_PATH, results_dir: Path = RESULTS_DIR) -> pd.DataFrame:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    rows: list[dict[str, Any]] = []
    missing: list[str] = []

    for run in manifest["runs"]:
        source = results_dir / run["source_file"]
        if not source.exists():
            missing.append(run["source_file"])
            continue
        row = {
            "config_label": run["config_label"],
            "cpu_limit": run["cpu_limit"],
            "memory_limit_mb": run["memory_limit_mb"],
            "load_level": run["load_level"],
            **extract_run_metrics(source),
        }
        rows.append(row)

    if missing:
        raise FileNotFoundError(
            "Canonical k6 result files are missing: " + ", ".join(missing)
        )
    if len(rows) != 9:
        raise ValueError(f"Expected 9 frozen runs, assembled {len(rows)}")

    frame = pd.DataFrame(rows, columns=DATASET_COLUMNS)
    load_order = {"low": 0, "medium": 1, "high": 2}
    config_order = {"unconstrained": 0, "cpu_1_mem_512": 1, "cpu_0.25_mem_128": 2}
    frame["_load"] = frame["load_level"].map(load_order)
    frame["_config"] = frame["config_label"].map(config_order)
    frame = frame.sort_values(["_load", "_config"]).drop(columns=["_load", "_config"]).reset_index(drop=True)
    return frame


def main() -> int:
    frame = assemble()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(OUTPUT_PATH, index=False)
    print(frame.to_string(index=False))
    print(f"\nWrote {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

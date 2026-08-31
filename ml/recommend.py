"""Lowest-resource configuration that still meets a latency/error threshold.

This is a transparent Phase 4 selector, not a trained model. It only chooses
among configurations that were actually measured at the requested load level.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent
DEFAULT_DATASET = ROOT / "data" / "experiment_dataset.csv"
DEFAULT_MAX_P95_MS = 50.0
DEFAULT_MAX_FAILED_RATE = 0.0


@dataclass(frozen=True)
class Recommendation:
    load_level: str
    config_label: str | None
    cpu_limit: float | None
    memory_limit_mb: float | None
    p95_latency_ms: float | None
    http_req_failed_rate: float | None
    max_p95_latency_ms: float
    max_http_req_failed_rate: float
    eligible_config_labels: tuple[str, ...]
    explanation: str


def _resource_sort_key(row: pd.Series) -> tuple[float, float]:
    cpu = row["cpu_limit"]
    memory = row["memory_limit_mb"]
    cpu_key = float("inf") if pd.isna(cpu) else float(cpu)
    memory_key = float("inf") if pd.isna(memory) else float(memory)
    return (cpu_key, memory_key)


def recommend(
    frame: pd.DataFrame,
    load_level: str,
    max_p95_latency_ms: float = DEFAULT_MAX_P95_MS,
    max_http_req_failed_rate: float = DEFAULT_MAX_FAILED_RATE,
) -> Recommendation:
    at_load = frame.loc[frame["load_level"] == load_level].copy()
    if at_load.empty:
        known = ", ".join(sorted(frame["load_level"].dropna().unique()))
        raise ValueError(f"No rows for load_level={load_level!r}. Dataset has: {known}")

    eligible_mask = (at_load["p95_latency_ms"] <= max_p95_latency_ms) & (
        at_load["http_req_failed_rate"] <= max_http_req_failed_rate
    )
    eligible = at_load.loc[eligible_mask].copy()
    eligible["_rank"] = eligible.apply(_resource_sort_key, axis=1)
    eligible = eligible.sort_values("_rank")

    labels = tuple(eligible["config_label"].tolist())
    if eligible.empty:
        tested = ", ".join(
            f"{row.config_label} (p95={row.p95_latency_ms:.2f} ms, fail={row.http_req_failed_rate:.2%})"
            for row in at_load.itertuples()
        )
        explanation = (
            f"No tested configuration at load_level={load_level} met "
            f"p95 <= {max_p95_latency_ms:g} ms and http_req_failed_rate <= {max_http_req_failed_rate:g}. "
            f"Measured: {tested}."
        )
        return Recommendation(
            load_level=load_level,
            config_label=None,
            cpu_limit=None,
            memory_limit_mb=None,
            p95_latency_ms=None,
            http_req_failed_rate=None,
            max_p95_latency_ms=max_p95_latency_ms,
            max_http_req_failed_rate=max_http_req_failed_rate,
            eligible_config_labels=(),
            explanation=explanation,
        )

    chosen = eligible.iloc[0]
    cpu = None if pd.isna(chosen["cpu_limit"]) else float(chosen["cpu_limit"])
    memory = None if pd.isna(chosen["memory_limit_mb"]) else float(chosen["memory_limit_mb"])
    resource_text = (
        "unconstrained CPU/memory"
        if cpu is None
        else f"{cpu:g} CPU / {memory:g} MB"
    )
    rejected = at_load.loc[~eligible_mask, "config_label"].tolist()
    rejected_text = (
        f" Rejected as over-threshold: {', '.join(rejected)}."
        if rejected
        else " Every tested config at this load met the threshold; the lowest-resource one is selected."
    )
    explanation = (
        f"At load_level={load_level}, eligible configs (p95 <= {max_p95_latency_ms:g} ms, "
        f"fail rate <= {max_http_req_failed_rate:g}) are: {', '.join(labels)}. "
        f"Selected {chosen['config_label']} ({resource_text}) because it uses the least allocated "
        f"CPU then memory among those eligible. Measured p95={chosen['p95_latency_ms']:.2f} ms, "
        f"fail rate={chosen['http_req_failed_rate']:.2%}.{rejected_text}"
    )
    return Recommendation(
        load_level=load_level,
        config_label=str(chosen["config_label"]),
        cpu_limit=cpu,
        memory_limit_mb=memory,
        p95_latency_ms=float(chosen["p95_latency_ms"]),
        http_req_failed_rate=float(chosen["http_req_failed_rate"]),
        max_p95_latency_ms=max_p95_latency_ms,
        max_http_req_failed_rate=max_http_req_failed_rate,
        eligible_config_labels=labels,
        explanation=explanation,
    )


def recommend_from_csv(
    dataset_path: Path = DEFAULT_DATASET,
    load_level: str = "high",
    max_p95_latency_ms: float = DEFAULT_MAX_P95_MS,
    max_http_req_failed_rate: float = DEFAULT_MAX_FAILED_RATE,
) -> Recommendation:
    frame = pd.read_csv(dataset_path)
    return recommend(frame, load_level, max_p95_latency_ms, max_http_req_failed_rate)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Recommend the lowest-resource tested config that meets a p95 latency threshold."
    )
    parser.add_argument("--load-level", choices=("low", "medium", "high"), default="high")
    parser.add_argument("--max-p95-ms", type=float, default=DEFAULT_MAX_P95_MS)
    parser.add_argument("--max-failed-rate", type=float, default=DEFAULT_MAX_FAILED_RATE)
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    args = parser.parse_args()

    result = recommend_from_csv(
        args.dataset,
        args.load_level,
        args.max_p95_ms,
        args.max_failed_rate,
    )
    print(result.explanation)
    if result.config_label is None:
        return 1
    print(f"recommendation: {result.config_label}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

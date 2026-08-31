"""Phase 5: compare a naive static baseline with the Phase 4 selector.

Naive strategy: always deploy `unconstrained`, regardless of load.
This is the simplest non-decision: never shrink CPU or memory.

The comparison uses the frozen 9-row experiment dataset only. It does not
re-run k6, change Docker limits, or train a model.
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from ml.recommend import (
    DEFAULT_DATASET,
    DEFAULT_MAX_FAILED_RATE,
    DEFAULT_MAX_P95_MS,
    recommend,
)

NAIVE_CONFIG_LABEL = "unconstrained"
LOAD_LEVELS = ("low", "medium", "high")
REPORT_PATH = Path(__file__).resolve().parent / "data" / "baseline_comparison.md"


@dataclass(frozen=True)
class LoadComparison:
    load_level: str
    naive_config_label: str
    naive_cpu_limit: float | None
    naive_memory_limit_mb: float | None
    naive_avg_latency_ms: float
    naive_p95_latency_ms: float
    naive_http_req_failed_rate: float
    recommended_config_label: str
    recommended_cpu_limit: float | None
    recommended_memory_limit_mb: float | None
    recommended_avg_latency_ms: float
    recommended_p95_latency_ms: float
    recommended_http_req_failed_rate: float
    naive_meets_slo: bool
    recommended_meets_slo: bool
    recommended_uses_fewer_resources: bool
    rationale: str


def _optional_float(value: object) -> float | None:
    if value is None or pd.isna(value):
        return None
    return float(value)


def _resource_key(cpu: float | None, memory: float | None) -> tuple[float, float]:
    return (
        float("inf") if cpu is None else cpu,
        float("inf") if memory is None else memory,
    )


def _resource_text(cpu: float | None, memory: float | None) -> str:
    if cpu is None:
        return "unconstrained (no CPU/memory limit)"
    return f"{cpu:g} CPU / {memory:g} MB"


def lookup_measured_row(frame: pd.DataFrame, load_level: str, config_label: str) -> pd.Series:
    match = frame.loc[(frame["load_level"] == load_level) & (frame["config_label"] == config_label)]
    if match.empty:
        raise ValueError(f"No measured row for load_level={load_level!r} config_label={config_label!r}")
    return match.iloc[0]


def compare_load_level(
    frame: pd.DataFrame,
    load_level: str,
    max_p95_latency_ms: float = DEFAULT_MAX_P95_MS,
    max_http_req_failed_rate: float = DEFAULT_MAX_FAILED_RATE,
) -> LoadComparison:
    naive = lookup_measured_row(frame, load_level, NAIVE_CONFIG_LABEL)
    selection = recommend(frame, load_level, max_p95_latency_ms, max_http_req_failed_rate)
    if selection.config_label is None:
        raise ValueError(f"Recommender found no eligible config at load_level={load_level!r}")
    recommended = lookup_measured_row(frame, load_level, selection.config_label)

    naive_cpu = _optional_float(naive["cpu_limit"])
    naive_mem = _optional_float(naive["memory_limit_mb"])
    rec_cpu = _optional_float(recommended["cpu_limit"])
    rec_mem = _optional_float(recommended["memory_limit_mb"])

    naive_slo = (float(naive["p95_latency_ms"]) <= max_p95_latency_ms) and (
        float(naive["http_req_failed_rate"]) <= max_http_req_failed_rate
    )
    rec_slo = (float(recommended["p95_latency_ms"]) <= max_p95_latency_ms) and (
        float(recommended["http_req_failed_rate"]) <= max_http_req_failed_rate
    )
    fewer_resources = _resource_key(rec_cpu, rec_mem) < _resource_key(naive_cpu, naive_mem)

    if selection.config_label == NAIVE_CONFIG_LABEL:
        rationale = (
            f"At {load_level} load the selector also chose unconstrained, so there is no resource saving "
            f"versus the naive baseline."
        )
    elif rec_slo and naive_slo and fewer_resources:
        rationale = (
            f"At {load_level} load the naive baseline would still deploy "
            f"{_resource_text(naive_cpu, naive_mem)}, with measured p95={float(naive['p95_latency_ms']):.2f} ms. "
            f"The selector recommends {selection.config_label} ({_resource_text(rec_cpu, rec_mem)}), "
            f"with measured p95={float(recommended['p95_latency_ms']):.2f} ms and 0% failures. "
            f"Both meet p95 <= {max_p95_latency_ms:g} ms, so unconstrained is needlessly expensive; "
            f"the recommended config uses less allocated CPU/memory while staying inside the same SLO."
        )
    else:
        rationale = (
            f"At {load_level} load naive={NAIVE_CONFIG_LABEL} (meets SLO={naive_slo}) versus "
            f"recommended={selection.config_label} (meets SLO={rec_slo})."
        )

    return LoadComparison(
        load_level=load_level,
        naive_config_label=NAIVE_CONFIG_LABEL,
        naive_cpu_limit=naive_cpu,
        naive_memory_limit_mb=naive_mem,
        naive_avg_latency_ms=float(naive["avg_latency_ms"]),
        naive_p95_latency_ms=float(naive["p95_latency_ms"]),
        naive_http_req_failed_rate=float(naive["http_req_failed_rate"]),
        recommended_config_label=str(selection.config_label),
        recommended_cpu_limit=rec_cpu,
        recommended_memory_limit_mb=rec_mem,
        recommended_avg_latency_ms=float(recommended["avg_latency_ms"]),
        recommended_p95_latency_ms=float(recommended["p95_latency_ms"]),
        recommended_http_req_failed_rate=float(recommended["http_req_failed_rate"]),
        naive_meets_slo=naive_slo,
        recommended_meets_slo=rec_slo,
        recommended_uses_fewer_resources=fewer_resources,
        rationale=rationale,
    )


def compare_all(
    frame: pd.DataFrame,
    max_p95_latency_ms: float = DEFAULT_MAX_P95_MS,
    max_http_req_failed_rate: float = DEFAULT_MAX_FAILED_RATE,
) -> list[LoadComparison]:
    return [
        compare_load_level(frame, load_level, max_p95_latency_ms, max_http_req_failed_rate)
        for load_level in LOAD_LEVELS
    ]


def render_markdown(
    comparisons: list[LoadComparison],
    max_p95_latency_ms: float = DEFAULT_MAX_P95_MS,
) -> str:
    lines = [
        "# Phase 5 baseline comparison",
        "",
        "Naive baseline: **always deploy `unconstrained`**, at every load level. No thresholds, no shrinking.",
        "",
        "Recommended side: `ml/recommend.py` on the frozen 9-row dataset "
        f"(p95 <= {max_p95_latency_ms:g} ms, fail rate <= 0).",
        "",
        "This is analysis of already-measured runs. It is not a new k6 experiment, not a live "
        "Docker redeploy, and not a trained model.",
        "",
        "| Load | Naive deploy | Naive p95 (ms) | Recommended deploy | Recommended p95 (ms) | Both meet SLO | Fewer resources |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for item in comparisons:
        lines.append(
            "| "
            + " | ".join(
                [
                    item.load_level,
                    item.naive_config_label,
                    f"{item.naive_p95_latency_ms:.2f}",
                    item.recommended_config_label,
                    f"{item.recommended_p95_latency_ms:.2f}",
                    "yes" if item.naive_meets_slo and item.recommended_meets_slo else "no",
                    "yes" if item.recommended_uses_fewer_resources else "no",
                ]
            )
            + " |"
        )

    lines.extend(["", "## Per load level", ""])
    for item in comparisons:
        lines.extend(
            [
                f"### {item.load_level}",
                "",
                f"- Naive would deploy: {_resource_text(item.naive_cpu_limit, item.naive_memory_limit_mb)}; "
                f"avg={item.naive_avg_latency_ms:.2f} ms, p95={item.naive_p95_latency_ms:.2f} ms, "
                f"fail={item.naive_http_req_failed_rate:.2%}.",
                f"- Selector recommends: `{item.recommended_config_label}` "
                f"({_resource_text(item.recommended_cpu_limit, item.recommended_memory_limit_mb)}); "
                f"avg={item.recommended_avg_latency_ms:.2f} ms, p95={item.recommended_p95_latency_ms:.2f} ms, "
                f"fail={item.recommended_http_req_failed_rate:.2%}.",
                f"- {item.rationale}",
                "",
            ]
        )

    lines.extend(
        [
            "## Limitation",
            "",
            "The project spec's fuller Phase 5 design is a fresh paired run of baseline vs recommended "
            "under the same workload. This report reuses the Phase 4 frozen measurements instead of "
            "re-running load tests.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare always-unconstrained vs the Phase 4 selector.")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--max-p95-ms", type=float, default=DEFAULT_MAX_P95_MS)
    parser.add_argument("--report", type=Path, default=REPORT_PATH)
    args = parser.parse_args()

    frame = pd.read_csv(args.dataset)
    comparisons = compare_all(frame, max_p95_latency_ms=args.max_p95_ms)
    markdown = render_markdown(comparisons, max_p95_latency_ms=args.max_p95_ms)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(markdown, encoding="utf-8")
    print(markdown.rstrip())
    print(f"\nWrote {args.report}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

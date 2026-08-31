"""Read-only HTTP wrappers around the Phase 4/5 ml selectors."""

from __future__ import annotations

from dataclasses import asdict

import pandas as pd
from fastapi import APIRouter, HTTPException, status

from app.ml_bridge import ensure_ml_importable

ensure_ml_importable()

from ml.assemble_dataset import OUTPUT_PATH
from ml.baseline_comparison import NAIVE_CONFIG_LABEL, compare_all
from ml.recommend import DEFAULT_MAX_FAILED_RATE, DEFAULT_MAX_P95_MS, recommend

VALID_LOAD_LEVELS = frozenset({"low", "medium", "high"})

router = APIRouter(tags=["recommendations"])


def _dataset_frame() -> pd.DataFrame:
    if not OUTPUT_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment dataset not found at {OUTPUT_PATH}",
        )
    return pd.read_csv(OUTPUT_PATH)


def _json_records(frame: pd.DataFrame) -> list[dict]:
    return frame.where(pd.notnull(frame), None).to_dict(orient="records")


def _rejected_configs(frame: pd.DataFrame, load_level: str, eligible: tuple[str, ...]) -> list[dict]:
    at_load = frame.loc[frame["load_level"] == load_level]
    rejected: list[dict] = []
    for row in at_load.itertuples():
        if row.config_label in eligible:
            continue
        reasons: list[str] = []
        if row.p95_latency_ms > DEFAULT_MAX_P95_MS:
            reasons.append(
                f"p95 {row.p95_latency_ms:.2f} ms exceeds {DEFAULT_MAX_P95_MS:g} ms"
            )
        if row.http_req_failed_rate > DEFAULT_MAX_FAILED_RATE:
            reasons.append(
                f"fail rate {row.http_req_failed_rate:.2%} exceeds {DEFAULT_MAX_FAILED_RATE:g}"
            )
        rejected.append(
            {
                "config_label": row.config_label,
                "reason": "; ".join(reasons) if reasons else "did not meet the selector threshold",
            }
        )
    return rejected


@router.get("/experiments/dataset")
def get_experiment_dataset() -> dict:
    """Return the frozen experiment CSV as JSON records."""

    frame = _dataset_frame()
    return {"rows": _json_records(frame), "row_count": int(len(frame))}


@router.get("/recommendations/comparison")
def get_recommendation_comparison() -> dict:
    """Naive always-unconstrained baseline vs the threshold selector."""

    comparisons = compare_all(_dataset_frame())
    return {
        "naive_strategy": f"always deploy {NAIVE_CONFIG_LABEL}",
        "comparisons": [asdict(item) for item in comparisons],
    }


@router.get("/recommendations/{load_level}")
def get_recommendation(load_level: str) -> dict:
    """Recommend the lowest-resource measured config that still meets the SLO."""

    if load_level not in VALID_LOAD_LEVELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid load_level {load_level!r}. Use one of: low, medium, high.",
        )

    frame = _dataset_frame()
    selection = recommend(frame, load_level)
    return {
        "load_level": selection.load_level,
        "recommended_config": selection.config_label,
        "cpu_limit": selection.cpu_limit,
        "memory_limit_mb": selection.memory_limit_mb,
        "p95_latency_ms": selection.p95_latency_ms,
        "http_req_failed_rate": selection.http_req_failed_rate,
        "eligible_config_labels": list(selection.eligible_config_labels),
        "rejected_configs": _rejected_configs(frame, load_level, selection.eligible_config_labels),
        "reasoning": selection.explanation,
    }

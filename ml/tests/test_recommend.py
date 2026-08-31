from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest

from ml.assemble_dataset import DATASET_COLUMNS, assemble
from ml.recommend import recommend, recommend_from_csv

DATASET = Path(__file__).resolve().parents[1] / "data" / "experiment_dataset.csv"


def test_assembled_dataset_has_nine_canonical_rows() -> None:
    frame = assemble()
    assert list(frame.columns) == DATASET_COLUMNS
    assert len(frame) == 9
    assert set(frame["config_label"]) == {"unconstrained", "cpu_1_mem_512", "cpu_0.25_mem_128"}
    assert set(frame["load_level"]) == {"low", "medium", "high"}


def test_committed_csv_matches_frozen_k6_files() -> None:
    assembled = assemble()
    committed = pd.read_csv(DATASET)
    pd.testing.assert_frame_equal(
        assembled.reset_index(drop=True),
        committed.reset_index(drop=True),
        check_dtype=False,
    )


def test_high_load_default_threshold_skips_stress_config() -> None:
    result = recommend_from_csv(DATASET, load_level="high")
    assert result.config_label == "cpu_1_mem_512"
    assert result.cpu_limit == 1.0
    assert "cpu_0.25_mem_128" not in result.eligible_config_labels
    assert "cpu_0.25_mem_128" in result.explanation


def test_low_and_medium_load_select_smallest_config() -> None:
    for load_level in ("low", "medium"):
        result = recommend_from_csv(DATASET, load_level=load_level)
        assert result.config_label == "cpu_0.25_mem_128"


def test_tight_threshold_only_unconstrained_at_high_load() -> None:
    frame = pd.read_csv(DATASET)
    result = recommend(frame, "high", max_p95_latency_ms=10.0)
    assert result.config_label == "unconstrained"
    assert result.eligible_config_labels == ("unconstrained",)


def test_impossible_threshold_returns_no_config() -> None:
    frame = pd.read_csv(DATASET)
    result = recommend(frame, "high", max_p95_latency_ms=1.0)
    assert result.config_label is None
    assert result.eligible_config_labels == ()


def test_unknown_load_level_raises() -> None:
    frame = pd.read_csv(DATASET)
    with pytest.raises(ValueError, match="No rows"):
        recommend(frame, "spike")

from __future__ import annotations

from pathlib import Path

import pandas as pd

from ml.baseline_comparison import (
    LOAD_LEVELS,
    NAIVE_CONFIG_LABEL,
    compare_all,
    compare_load_level,
    render_markdown,
)
from ml.recommend import DEFAULT_MAX_P95_MS

DATASET = Path(__file__).resolve().parents[1] / "data" / "experiment_dataset.csv"


def test_naive_baseline_is_always_unconstrained() -> None:
    frame = pd.read_csv(DATASET)
    for load_level in LOAD_LEVELS:
        result = compare_load_level(frame, load_level)
        assert result.naive_config_label == NAIVE_CONFIG_LABEL
        assert result.naive_cpu_limit is None
        assert result.naive_memory_limit_mb is None


def test_selector_beats_naive_on_resources_while_meeting_slo() -> None:
    frame = pd.read_csv(DATASET)
    expected = {
        "low": "cpu_0.25_mem_128",
        "medium": "cpu_0.25_mem_128",
        "high": "cpu_1_mem_512",
    }
    comparisons = compare_all(frame)

    assert [item.load_level for item in comparisons] == list(LOAD_LEVELS)
    for item in comparisons:
        assert item.recommended_config_label == expected[item.load_level]
        assert item.recommended_config_label != item.naive_config_label
        assert item.naive_meets_slo
        assert item.recommended_meets_slo
        assert item.recommended_p95_latency_ms <= DEFAULT_MAX_P95_MS
        assert item.recommended_uses_fewer_resources
        assert "needlessly expensive" in item.rationale


def test_markdown_report_covers_each_load_level() -> None:
    frame = pd.read_csv(DATASET)
    markdown = render_markdown(compare_all(frame))
    assert "always deploy `unconstrained`" in markdown
    for load_level in LOAD_LEVELS:
        assert f"### {load_level}" in markdown
    assert "cpu_0.25_mem_128" in markdown
    assert "cpu_1_mem_512" in markdown
    assert "already-measured" in markdown
    assert "re-running load tests" in markdown

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
RESULTS_DIR = ROOT / "results"
SUMMARY_PATH = RESULTS_DIR / "baseline_summary.md"


@dataclass(slots=True)
class ResultRecord:
    profile: str
    timestamp: str
    total_requests: int | None
    avg_ms: float | None
    p95_ms: float | None
    p99_ms: float | None
    failed_rate: float | None
    vu_count: int | None
    source_file: str


def parse_profile_and_timestamp(path: Path, payload: dict[str, Any]) -> tuple[str, str]:
    """k6 JSON summaries can wrap metadata a little differently between versions.

    Our saved baseline files also include top-level `profile` and `generated_at`, but
    we still fall back to the filename so this keeps working if the wrapper changes.
    """

    profile = payload.get("profile") or path.stem.rsplit("_", 1)[0]
    timestamp = payload.get("generated_at") or path.stem.rsplit("_", 1)[-1]
    return profile, timestamp


def get_summary_block(payload: dict[str, Any]) -> dict[str, Any]:
    # k6 handleSummary output in this project stores the raw k6 summary under `summary`.
    # If future runs write the raw k6 object directly, this keeps the script compatible.
    summary = payload.get("summary")
    if isinstance(summary, dict):
        return summary
    return payload


def extract_trend_value(metrics: dict[str, Any], metric_name: str, value_key: str) -> float | None:
    metric = metrics.get(metric_name, {})
    values = metric.get("values", {})
    value = values.get(value_key)
    if isinstance(value, (int, float)):
        return float(value)
    return None


def extract_int_value(metrics: dict[str, Any], metric_name: str, value_key: str) -> int | None:
    metric = metrics.get(metric_name, {})
    values = metric.get("values", {})
    value = values.get(value_key)
    if isinstance(value, (int, float)):
        return int(value)
    return None


def extract_record(path: Path) -> ResultRecord:
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    profile, timestamp = parse_profile_and_timestamp(path, payload)
    summary = get_summary_block(payload)
    metrics = summary.get("metrics", {})

    # k6 trend metrics commonly expose stats at `metrics.http_req_duration.values["avg"]`
    # and percentiles at `values["p(95)"]` / sometimes `values["p(99)"]` depending on version.
    duration = metrics.get("http_req_duration", {}).get("values", {})
    total_requests = extract_int_value(metrics, "http_reqs", "count")
    avg_ms = duration.get("avg") if isinstance(duration.get("avg"), (int, float)) else None
    p95_ms = duration.get("p(95)") if isinstance(duration.get("p(95)"), (int, float)) else None
    p99_ms = None
    for candidate in ("p(99)", "p99"):
        value = duration.get(candidate)
        if isinstance(value, (int, float)):
            p99_ms = float(value)
            break

    failed_rate = extract_trend_value(metrics, "http_req_failed", "rate")

    # Prefer `vus_max.values.max` so we capture the peak VU count reached by the staged profile.
    # Some k6 versions expose `vus` as the live value and `vus_max` as the peak; both are checked.
    vu_count = (
        extract_int_value(metrics, "vus_max", "max")
        or extract_int_value(metrics, "vus", "max")
        or extract_int_value(metrics, "vus_max", "value")
        or extract_int_value(metrics, "vus", "value")
    )

    return ResultRecord(
        profile=profile,
        timestamp=timestamp,
        total_requests=total_requests,
        avg_ms=avg_ms,
        p95_ms=p95_ms,
        p99_ms=p99_ms,
        failed_rate=failed_rate,
        vu_count=vu_count,
        source_file=path.name,
    )


def format_number(value: float | int | None, digits: int = 2, suffix: str = "") -> str:
    if value is None:
        return "n/a"
    if isinstance(value, int):
        return f"{value}{suffix}"
    return f"{value:.{digits}f}{suffix}"


def format_rate(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value * 100:.2f}%"


def build_markdown_table(records: list[ResultRecord]) -> str:
    if not records:
        return "# k6 Baseline Summary\n\nNo k6 JSON result files were found in `load-tests/results/`.\n"

    columns = [f"{record.profile}<br><sub>{record.timestamp}</sub>" for record in records]
    headers = ["Metric", *columns]
    rows = [
        ["Source file", *[record.source_file for record in records]],
        ["Total requests", *[format_number(record.total_requests, 0) for record in records]],
        ["Avg http_req_duration (ms)", *[format_number(record.avg_ms) for record in records]],
        ["P95 http_req_duration (ms)", *[format_number(record.p95_ms) for record in records]],
        ["P99 http_req_duration (ms)", *[format_number(record.p99_ms) for record in records]],
        ["http_req_failed rate", *[format_rate(record.failed_rate) for record in records]],
        ["VU count", *[format_number(record.vu_count, 0) for record in records]],
    ]

    lines = ["# k6 Baseline Summary", "", "| " + " | ".join(headers) + " |"]
    lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")

    lines.extend(
        [
            "",
            "Notes:",
            "- Percentiles are read from `metrics.http_req_duration.values[\"p(95)\"]` and `p(99)`/`p99` when present.",
            "- Total requests come from `metrics.http_reqs.values.count`.",
            "- VU count prefers `metrics.vus_max.values.max`, then falls back to `metrics.vus` fields.",
        ]
    )
    return "\n".join(lines) + "\n"


def print_terminal_table(markdown_table: str) -> None:
    print(markdown_table.rstrip())


def main() -> int:
    RESULT_FILES = sorted(RESULTS_DIR.glob("*.json"))
    records = [extract_record(path) for path in RESULT_FILES]

    # Keep the comparison stable and easy to read: low -> medium -> high, then by timestamp.
    profile_order = {"low_load": 0, "medium_load": 1, "high_load": 2}
    records.sort(key=lambda record: (profile_order.get(record.profile, 99), record.timestamp, record.source_file))

    summary_markdown = build_markdown_table(records)
    SUMMARY_PATH.write_text(summary_markdown, encoding="utf-8")
    print_terminal_table(summary_markdown)
    print(f"\nWrote Markdown summary to {SUMMARY_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
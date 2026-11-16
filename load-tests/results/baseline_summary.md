# k6 Baseline Summary

| Metric | low_load<br><sub>2026-08-29T12:32:27.350Z</sub> | low_load<br><sub>2026-08-29T12:39:37.502Z</sub> | low_load<br><sub>2026-08-29T12:54:46.414Z</sub> | medium_load<br><sub>2026-08-29T12:34:28.459Z</sub> | medium_load<br><sub>2026-08-29T12:41:38.441Z</sub> | medium_load<br><sub>2026-08-29T12:56:47.310Z</sub> | high_load<br><sub>2026-08-29T12:36:29.566Z</sub> | high_load<br><sub>2026-08-29T12:43:39.708Z</sub> | high_load<br><sub>2026-08-29T12:58:48.531Z</sub> |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Source file | low_load_baseline_v2_2026-08-29T12-32-27-350Z.json | low_load_constrained_v2_2026-08-29T12-39-37-501Z.json | low_load_stress_v1_2026-08-29T12-54-46-414Z.json | medium_load_baseline_v2_2026-08-29T12-34-28-458Z.json | medium_load_constrained_v2_2026-08-29T12-41-38-436Z.json | medium_load_stress_v1_2026-08-29T12-56-47-306Z.json | high_load_baseline_v2_2026-08-29T12-36-29-565Z.json | high_load_constrained_v2_2026-08-29T12-43-39-708Z.json | high_load_stress_v1_2026-08-29T12-58-48-527Z.json |
| Total requests | 1379 | 1384 | 1364 | 5251 | 5265 | 5237 | 13098 | 13060 | 11353 |
| Avg http_req_duration (ms) | 3.70 | 3.39 | 3.27 | 3.26 | 3.35 | 3.57 | 3.38 | 3.95 | 57.86 |
| P95 http_req_duration (ms) | 9.10 | 7.68 | 8.12 | 8.22 | 8.71 | 9.32 | 9.86 | 11.40 | 275.87 |
| P99 http_req_duration (ms) | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| http_req_failed rate | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% |
| VU count | 5 | 5 | 5 | 20 | 20 | 20 | 50 | 50 | 50 |

Notes:
- Percentiles are read from `metrics.http_req_duration.values["p(95)"]` and `p(99)`/`p99` when present.
- Total requests come from `metrics.http_reqs.values.count`.
- VU count prefers `metrics.vus_max.values.max`, then falls back to `metrics.vus` fields.

# k6 Baseline Summary

| Metric | low_load<br><sub>2026-08-29T11:31:39.156Z</sub> | medium_load<br><sub>2026-08-29T11:39:51.668Z</sub> | high_load<br><sub>2026-08-29T11:42:10.071Z</sub> |
| --- | --- | --- | --- |
| Source file | low_load_2026-08-29T11-31-39-156Z.json | medium_load_2026-08-29T11-39-51-666Z.json | high_load_2026-08-29T11-42-10-070Z.json |
| Total requests | 1362 | 5116 | 11690 |
| Avg http_req_duration (ms) | 5.43 | 10.68 | 43.32 |
| P95 http_req_duration (ms) | 10.01 | 15.47 | 211.75 |
| P99 http_req_duration (ms) | n/a | n/a | n/a |
| http_req_failed rate | 0.00% | 0.00% | 0.00% |
| VU count | 5 | 20 | 50 |

Notes:
- Percentiles are read from `metrics.http_req_duration.values["p(95)"]` and `p(99)`/`p99` when present.
- Total requests come from `metrics.http_reqs.values.count`.
- VU count prefers `metrics.vus_max.values.max`, then falls back to `metrics.vus` fields.

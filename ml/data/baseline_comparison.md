# Phase 5 baseline comparison

Naive baseline: **always deploy `unconstrained`**, at every load level. No thresholds, no shrinking.

Recommended side: `ml/recommend.py` on the frozen 9-row dataset (p95 <= 50 ms, fail rate <= 0).

This is analysis of already-measured runs. It is not a new k6 experiment, not a live Docker redeploy, and not a trained model.

| Load | Naive deploy | Naive p95 (ms) | Recommended deploy | Recommended p95 (ms) | Both meet SLO | Fewer resources |
| --- | --- | --- | --- | --- | --- | --- |
| low | unconstrained | 9.10 | cpu_0.25_mem_128 | 8.12 | yes | yes |
| medium | unconstrained | 8.22 | cpu_0.25_mem_128 | 9.32 | yes | yes |
| high | unconstrained | 9.86 | cpu_1_mem_512 | 11.40 | yes | yes |

## Per load level

### low

- Naive would deploy: unconstrained (no CPU/memory limit); avg=3.70 ms, p95=9.10 ms, fail=0.00%.
- Selector recommends: `cpu_0.25_mem_128` (0.25 CPU / 128 MB); avg=3.27 ms, p95=8.12 ms, fail=0.00%.
- At low load the naive baseline would still deploy unconstrained (no CPU/memory limit), with measured p95=9.10 ms. The selector recommends cpu_0.25_mem_128 (0.25 CPU / 128 MB), with measured p95=8.12 ms and 0% failures. Both meet p95 <= 50 ms, so unconstrained is needlessly expensive; the recommended config uses less allocated CPU/memory while staying inside the same SLO.

### medium

- Naive would deploy: unconstrained (no CPU/memory limit); avg=3.26 ms, p95=8.22 ms, fail=0.00%.
- Selector recommends: `cpu_0.25_mem_128` (0.25 CPU / 128 MB); avg=3.57 ms, p95=9.32 ms, fail=0.00%.
- At medium load the naive baseline would still deploy unconstrained (no CPU/memory limit), with measured p95=8.22 ms. The selector recommends cpu_0.25_mem_128 (0.25 CPU / 128 MB), with measured p95=9.32 ms and 0% failures. Both meet p95 <= 50 ms, so unconstrained is needlessly expensive; the recommended config uses less allocated CPU/memory while staying inside the same SLO.

### high

- Naive would deploy: unconstrained (no CPU/memory limit); avg=3.38 ms, p95=9.86 ms, fail=0.00%.
- Selector recommends: `cpu_1_mem_512` (1 CPU / 512 MB); avg=3.95 ms, p95=11.40 ms, fail=0.00%.
- At high load the naive baseline would still deploy unconstrained (no CPU/memory limit), with measured p95=9.86 ms. The selector recommends cpu_1_mem_512 (1 CPU / 512 MB), with measured p95=11.40 ms and 0% failures. Both meet p95 <= 50 ms, so unconstrained is needlessly expensive; the recommended config uses less allocated CPU/memory while staying inside the same SLO.

## Limitation

The project spec's fuller Phase 5 design is a fresh paired run of baseline vs recommended under the same workload. This report reuses the Phase 4 frozen measurements instead of re-running load tests.

import { buildOptions, driveTargetApp, makeHandleSummary } from './shared.js';

// High-load profile: a heavier burst intended to stress the target app and make saturation visible in Grafana.
// It is useful for spotting latency spikes or error-rate changes when the service is pushed harder.
export const options = buildOptions({
  vus: 50,
  p95ThresholdMs: 1400,
});

export const handleSummary = makeHandleSummary('high_load');

export default function () {
  driveTargetApp();
}
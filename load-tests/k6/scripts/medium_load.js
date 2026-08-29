import { buildOptions, driveTargetApp, makeHandleSummary } from './shared.js';

// Medium-load profile: a more realistic everyday traffic shape with enough concurrency to show latency changes.
// It helps compare the target app’s behavior under normal operating pressure.
export const options = buildOptions({
  vus: 20,
  p95ThresholdMs: 900,
});

export const handleSummary = makeHandleSummary('medium_load');

export default function () {
  driveTargetApp();
}
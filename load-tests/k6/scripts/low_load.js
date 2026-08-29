import { buildOptions, driveTargetApp, makeHandleSummary } from './shared.js';

// Low-load profile: a small, steady baseline that ramps up gently, holds, then ramps down.
// It simulates a light traffic window so you can confirm the target app stays healthy under modest pressure.
export const options = buildOptions({
  vus: 5,
  p95ThresholdMs: 600,
});

export const handleSummary = makeHandleSummary('low_load');

export default function () {
  driveTargetApp();
}
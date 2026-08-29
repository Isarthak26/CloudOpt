import http from 'k6/http';
import { check, sleep } from 'k6';

export const TARGET_APP_URL = __ENV.TARGET_APP_URL || 'http://127.0.0.1:8080';
export const SAMPLE_ORDER = JSON.stringify({
  product_id: 1,
  quantity: 1,
});

export function buildStages(vus) {
  const half = Math.max(1, Math.round(vus / 2));

  return [
    { duration: '15s', target: half },
    { duration: '15s', target: vus },
    { duration: '60s', target: vus },
    { duration: '15s', target: half },
    { duration: '15s', target: 0 },
  ];
}

export function buildOptions({ vus, p95ThresholdMs }) {
  return {
    stages: buildStages(vus),
    thresholds: {
      http_req_duration: [`p(95)<${p95ThresholdMs}`],
      http_req_failed: ['rate<0.05'],
    },
  };
}

export function makeHandleSummary(profileName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = `load-tests/results/${profileName}_${timestamp}.json`;

  return function handleSummary(data) {
    return {
      [outputPath]: JSON.stringify(
        {
          profile: profileName,
          generated_at: new Date().toISOString(),
          summary: data,
        },
        null,
        2,
      ),
      stdout: [
        '',
        `Saved k6 summary to ${outputPath}`,
        `http_req_duration p95: ${data.metrics.http_req_duration.values['p(95)']} ms`,
        `http_req_failed rate: ${data.metrics.http_req_failed.values.rate}`,
        '',
      ].join('\n'),
    };
  };
}

function recordHealth() {
  const response = http.get(`${TARGET_APP_URL}/health`);
  check(response, {
    'health endpoint returned 200': (r) => r.status === 200,
  });
}

function recordProductsRequest() {
  const response = http.get(`${TARGET_APP_URL}/products`);
  check(response, {
    'products endpoint returned 200': (r) => r.status === 200,
    'products response is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });
}

function recordComputeRequest() {
  const response = http.get(`${TARGET_APP_URL}/compute?iterations=100000`);
  check(response, {
    'compute endpoint returned 200': (r) => r.status === 200,
    'compute response includes checksum': (r) => r.body.includes('checksum'),
  });
}

function recordOrderRequest() {
  const response = http.post(`${TARGET_APP_URL}/orders`, SAMPLE_ORDER, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response, {
    'orders endpoint returned 201': (r) => r.status === 201,
    'orders response includes created status': (r) => r.body.includes('created'),
  });
}

export function driveTargetApp() {
  if (__ITER % 10 === 0) {
    recordHealth();
  }

  const roll = Math.random();
  if (roll < 0.55) {
    recordProductsRequest();
  } else if (roll < 0.9) {
    recordComputeRequest();
  } else {
    recordOrderRequest();
  }

  sleep(0.25 + Math.random() * 0.25);
}
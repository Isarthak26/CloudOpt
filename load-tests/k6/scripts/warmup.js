import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    warmup: {
      executor: 'constant-vus',
      vus: 5,
      duration: '40s',
    },
  },
};

const baseUrl = __ENV.TARGET_APP_URL || 'http://127.0.0.1:8080';
const endpoints = ['/health', '/products'];

export default function () {
  const path = endpoints[__ITER % endpoints.length];
  const response = http.get(`${baseUrl}${path}`);

  check(response, {
    'status is 200': (res) => res.status === 200,
  });

  sleep(1);
}

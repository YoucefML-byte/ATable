// Rush load test (vol. 08 §1.2), with k6 (https://k6.io), against the staging environment ONLY:
//   BASE=https://bistrot-recette.atable.fr TOKENS=tok1,tok2,... k6 run tests/load/rush.js
// Scenario: 40 tables scan and browse the menu, then each sends an order every ~2 minutes for
// 10 minutes. Thresholds: menu p95 < 800 ms, order p95 < 1.5 s, < 1 % errors.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE = __ENV.BASE;
const TOKENS = (__ENV.TOKENS || '').split(',').filter(Boolean);
const PRODUCT = __ENV.PRODUCT_ID; // an always-available product of the staging shop

if (!BASE || TOKENS.length === 0 || !PRODUCT) {
  throw new Error('BASE, TOKENS and PRODUCT_ID are required (staging only, never production).');
}

export const options = {
  scenarios: {
    rush: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 40 },
        { duration: '8m', target: 40 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{name:menu}': ['p(95)<800'],
    'http_req_duration{name:order}': ['p(95)<1500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function rush() {
  const token = TOKENS[(__VU - 1) % TOKENS.length];
  const jar = http.cookieJar();
  const scan = http.get(`${BASE}/t/${token}`, { redirects: 1, tags: { name: 'scan' } });
  check(scan, { 'scan ok': (r) => r.status === 200 });
  for (let i = 0; i < 5; i++) {
    const menu = http.get(`${BASE}/carte`, { tags: { name: 'menu' } });
    check(menu, { 'menu ok': (r) => r.status === 200 });
    sleep(20 + Math.random() * 40);
    const order = http.post(
      `${BASE}/api/orders`,
      JSON.stringify({
        idempotencyKey: uuidv4(),
        note: null,
        items: [{ product_id: PRODUCT, quantity: 1, options: [] }],
      }),
      { headers: { 'Content-Type': 'application/json', Origin: BASE }, tags: { name: 'order' } },
    );
    // 429 is an expected answer of the anti-abuse limits, not a failure of the platform.
    check(order, {
      'order accepted or limited': (r) => r.status === 200 || r.status === 201 || r.status === 429,
    });
    sleep(60 + Math.random() * 60);
  }
  jar.clear(BASE);
}

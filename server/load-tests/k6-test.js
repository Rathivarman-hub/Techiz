/**
 * Techiz Load Test — k6
 * WHY: k6 simulates realistic user journeys (not just endpoint hammering).
 * It ramps up gradually, tests mixed read/write traffic, and enforces SLA thresholds.
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run:        k6 run load-tests/k6-test.js
 * Dashboard:  k6 run --out dashboard load-tests/k6-test.js
 * HTML report: k6 run --out json=results.json load-tests/k6-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ────────────────────────────────────────────────────────────
const cacheHits = new Counter('cache_hits');
const errorRate = new Rate('error_rate');
const leaderboardDuration = new Trend('leaderboard_duration', true);
const loginDuration = new Trend('login_duration', true);

// ─── Test Configuration ────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // ── Scenario 1: Ramp up to 1000 concurrent users ──────────────────────────
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },   // warm up
        { duration: '1m',  target: 500 },   // ramp to 500 users
        { duration: '2m',  target: 1000 },  // hold at 1000 users
        { duration: '30s', target: 0 },     // cool down
      ],
    },

    // ── Scenario 2: Constant low load (background baseline) ───────────────────
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '4m',
      startTime: '10s',
    },
  },

  // ─── SLA Thresholds (fail the test if these are breached) ─────────────────
  // WHY: Thresholds enforce your performance contract. If p95 > 500ms, the
  // test fails and CI/CD pipeline stops the deploy.
  thresholds: {
    http_req_duration: [
      'p(95)<500',   // 95% of requests must complete within 500ms
      'p(99)<2000',  // 99% within 2s
    ],
    error_rate:     ['rate<0.01'],  // less than 1% error rate
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''; // Set via: k6 run -e AUTH_TOKEN=xxx

const headers = (withAuth = false) => ({
  'Content-Type': 'application/json',
  ...(withAuth && AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
});

// ─── Main Test Function ────────────────────────────────────────────────────────
// k6 calls this function repeatedly for each virtual user
export default function () {
  // 70% read traffic, 30% write (realistic ratio for an assessment platform)
  const rand = Math.random();

  if (rand < 0.30) {
    readLeaderboard();
  } else if (rand < 0.50) {
    checkHealth();
  } else if (rand < 0.65) {
    readLeaderboardByLanguage();
  } else if (rand < 0.80) {
    attemptLogin();
  } else {
    checkHealth();
  }

  sleep(Math.random() * 2 + 0.5); // random think time 0.5–2.5s
}

// ─── Scenario: Health Check ───────────────────────────────────────────────────
function checkHealth() {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`, { headers: headers() });
    const ok = check(res, {
      'health: status 200': (r) => r.status === 200,
      'health: has status field': (r) => JSON.parse(r.body).status === 'OK',
      'health: response <100ms': (r) => r.timings.duration < 100,
    });
    errorRate.add(!ok);
  });
}

// ─── Scenario: Leaderboard (most common hot read) ─────────────────────────────
function readLeaderboard() {
  group('Leaderboard', () => {
    const res = http.get(`${BASE_URL}/api/leaderboard?limit=50`, { headers: headers() });
    leaderboardDuration.add(res.timings.duration);

    const ok = check(res, {
      'leaderboard: status 200': (r) => r.status === 200,
      'leaderboard: has data': (r) => {
        try { return Array.isArray(JSON.parse(r.body).data); } catch { return false; }
      },
      'leaderboard: p95 <200ms': (r) => r.timings.duration < 200,
    });
    errorRate.add(!ok);

    // Check if response came from cache
    const body = JSON.parse(res.body || '{}');
    if (body.cached) cacheHits.add(1);
  });
}

// ─── Scenario: Leaderboard by Language ───────────────────────────────────────
function readLeaderboardByLanguage() {
  const languages = ['java', 'python', 'javascript', 'c', 'cpp'];
  const lang = languages[Math.floor(Math.random() * languages.length)];

  group('Leaderboard by Language', () => {
    const res = http.get(`${BASE_URL}/api/leaderboard?language=${lang}`, { headers: headers() });
    check(res, {
      'leaderboard lang: status 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
  });
}

// ─── Scenario: Login (tests rate limiter) ────────────────────────────────────
function attemptLogin() {
  group('Login', () => {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'loadtest@test.com', password: 'password123' }),
      { headers: headers() }
    );
    loginDuration.add(res.timings.duration);

    // 200 = login OK, 401 = bad creds (expected), 429 = rate limited (expected)
    const ok = check(res, {
      'login: valid response': (r) => [200, 401, 429].includes(r.status),
      'login: not 500': (r) => r.status !== 500,
    });
    errorRate.add(!ok);
  });
}

// ─── Setup (runs once before all VUs) ─────────────────────────────────────────
export function setup() {
  console.log(`\n🚀 k6 Load Test — Techiz`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Thresholds: p95 < 500ms, error rate < 1%\n`);
  return {};
}

// ─── Teardown (runs once after all VUs finish) ────────────────────────────────
export function teardown(data) {
  console.log('\n✅ Load test complete!');
}

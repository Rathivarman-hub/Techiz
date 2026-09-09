/**
 * Techiz Load Test — Autocannon
 * WHY: Load testing reveals bottlenecks BEFORE real users do.
 * Run BEFORE and AFTER optimizations to measure actual improvement.
 *
 * Install: npm install -g autocannon
 * Run:     node load-tests/autocannon-test.js
 */

import autocannon from 'autocannon';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// ─── Utility ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const printResults = (label, result) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${label}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Requests/sec:     ${result.requests.mean.toFixed(1)}`);
  console.log(`  Latency avg:      ${result.latency.mean.toFixed(2)} ms`);
  console.log(`  Latency p95:      ${result.latency.p95} ms`);
  console.log(`  Latency p99:      ${result.latency.p99} ms`);
  console.log(`  Throughput:       ${(result.throughput.mean / 1024).toFixed(1)} KB/s`);
  console.log(`  Errors:           ${result.errors}`);
  console.log(`  Non-2xx:          ${result.non2xx}`);
  console.log(`  Total Requests:   ${result.requests.total}`);
  console.log(`  Duration:         ${result.duration}s`);
};

const run = (opts) =>
  new Promise((resolve, reject) => {
    const instance = autocannon({ ...opts, outputStream: null }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    autocannon.track(instance, { renderProgressBar: true });
  });

// ─── Tests ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n🚀 Techiz Load Test Suite`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`\n⚠️  Make sure the server is running: npm start\n`);

  // ── Test 1: Health Check Baseline ──────────────────────────────────────────
  // This should be the fastest endpoint. Establishes your server's peak capacity.
  const health = await run({
    url: `${BASE_URL}/api/health`,
    connections: 100,   // 100 concurrent connections
    duration: 10,       // 10 seconds
    title: 'Health Check',
  });
  printResults('Health Check Baseline (target: >1000 req/s)', health);
  await sleep(2000);

  // ── Test 2: Leaderboard (cached after first hit) ────────────────────────────
  // After first request warms the cache, all subsequent hits should be ~1ms.
  const leaderboard = await run({
    url: `${BASE_URL}/api/leaderboard`,
    connections: 200,
    duration: 15,
    title: 'Leaderboard',
  });
  printResults('Leaderboard (cached — target: >500 req/s, p95 <50ms)', leaderboard);
  await sleep(2000);

  // ── Test 3: Auth Login Flood ────────────────────────────────────────────────
  // Rate limiter should kick in at 10 req/15min per IP.
  // Expect HTTP 429 responses — that's the correct behavior.
  const login = await run({
    url: `${BASE_URL}/api/auth/login`,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' }),
    connections: 50,
    duration: 10,
    title: 'Auth Login (rate-limit test)',
  });
  printResults('Auth Login (expect 429s from rate limiter)', login);
  await sleep(2000);

  // ── Test 4: Admin Stats (cached) ────────────────────────────────────────────
  // NOTE: You'll need to supply a valid admin JWT token.
  // Get one by logging in as admin and copying the token.
  const adminToken = process.env.ADMIN_TOKEN || 'REPLACE_WITH_ADMIN_JWT';
  if (adminToken !== 'REPLACE_WITH_ADMIN_JWT') {
    const stats = await run({
      url: `${BASE_URL}/api/admin/stats`,
      headers: { authorization: `Bearer ${adminToken}` },
      connections: 50,
      duration: 10,
    });
    printResults('Admin Stats (cached — target: <30ms)', stats);
    await sleep(2000);
  } else {
    console.log('\n⏭️  Skipping admin stats test — set ADMIN_TOKEN env var to run it.');
  }

  console.log('\n✅ Load test complete!\n');
  console.log('📋 Next steps:');
  console.log('  1. Run BEFORE optimizations, save results');
  console.log('  2. Apply optimizations');
  console.log('  3. Run AFTER optimizations, compare results');
  console.log('  4. For sustained load testing, use k6: node load-tests/k6-test.js\n');
})();

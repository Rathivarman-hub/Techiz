import test from 'node:test';
import assert from 'node:assert/strict';

import { authLimiter, generalLimiter, adminLimiter } from './rateLimiter.js';

test('rate limiter middleware factories should build without IPv6 keyGenerator validation errors', () => {
  assert.ok(authLimiter);
  assert.ok(generalLimiter);
  assert.ok(adminLimiter);
});

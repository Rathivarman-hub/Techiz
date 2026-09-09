import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, isRedisConnected } from '../config/redis.js';
import logger from '../config/logger.js';

/**
 * Build a rate limiter, using Redis store if available (shared across PM2 workers),
 * falling back to in-memory store in dev or when Redis is unavailable.
 */
const buildLimiter = ({ windowMs, max, message, prefix }) => {
  const options = {
    windowMs,
    max,
    standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip || 'unknown'),
    handler: (req, res) => {
      logger.warn(`Rate limit hit: ${req.ip} on ${req.originalUrl}`);
      res.status(429).json({
        success: false,
        message,
      });
    },
  };

  if (isRedisConnected()) {
    options.store = new RedisStore({
      sendCommand: (...args) => getRedisClient().call(...args),
      prefix,
    });
  }

  return rateLimit(options);
};

// ─── Auth limiter ─────────────────────────────────────────────────────────────
// Prevents brute-force on login/register: max 10 requests per 15 minutes per IP
export const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many auth attempts from this IP. Please try again after 15 minutes.',
  prefix: 'rl:auth:',
});

// ─── General API limiter ──────────────────────────────────────────────────────
// General protection against DDoS: 200 requests per minute per IP
export const generalLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP. Please slow down.',
  prefix: 'rl:api:',
});

// ─── Admin limiter ────────────────────────────────────────────────────────────
// Admin routes are sensitive — tighter limit
export const adminLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Admin rate limit exceeded. Please slow down.',
  prefix: 'rl:admin:',
});

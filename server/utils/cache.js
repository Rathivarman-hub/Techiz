import { getRedisClient, isRedisConnected } from '../config/redis.js';
import logger from '../config/logger.js';

/**
 * Get a cached value by key.
 * Returns parsed JSON or null if not found / Redis down.
 */
export const getCache = async (key) => {
  if (!isRedisConnected()) return null;
  try {
    const data = await getRedisClient().get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.warn(`Cache GET failed [${key}]: ${err.message}`);
    return null;
  }
};

/**
 * Set a cached value with an optional TTL (seconds).
 * Silently degrades if Redis is unavailable.
 */
export const setCache = async (key, data, ttlSeconds = 60) => {
  if (!isRedisConnected()) return;
  try {
    await getRedisClient().setex(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    logger.warn(`Cache SET failed [${key}]: ${err.message}`);
  }
};

/**
 * Delete a specific cache key.
 */
export const deleteCache = async (key) => {
  if (!isRedisConnected()) return;
  try {
    await getRedisClient().del(key);
  } catch (err) {
    logger.warn(`Cache DEL failed [${key}]: ${err.message}`);
  }
};

/**
 * Delete all keys matching a glob pattern (e.g. "leaderboard:*").
 * Uses SCAN to avoid blocking Redis.
 */
export const deleteCachePattern = async (pattern) => {
  if (!isRedisConnected()) return;
  try {
    const redis = getRedisClient();
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Cache invalidated ${keys.length} keys matching [${pattern}]`);
      }
    } while (cursor !== '0');
  } catch (err) {
    logger.warn(`Cache SCAN-DEL failed [${pattern}]: ${err.message}`);
  }
};

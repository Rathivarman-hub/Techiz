import asyncHandler from 'express-async-handler';
import Assessment from '../models/Assessment.js';
import { getCache, setCache } from '../utils/cache.js';

// ─── Cache TTLs ───────────────────────────────────────────────────────────────
const LEADERBOARD_TTL = 60; // 1 minute — acceptable staleness for rankings
const RANK_TTL = 30;        // 30 seconds for personal rank

// @desc    Get leaderboard (overall or by language)
// @route   GET /api/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { language, limit = 50 } = req.query;
  const cacheKey = `leaderboard:${language || 'all'}:${limit}`;

  // WHY: Leaderboard is the hottest read endpoint. Every student viewing it runs a
  // large aggregation. Caching for 60s means 60 seconds of requests all hit Redis
  // at <1ms instead of MongoDB at ~200ms. Under 1000 req/s that's 60,000 DB calls
  // saved per minute.
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ success: true, cached: true, data: cached });

  const matchStage = { status: 'completed' };
  if (language) matchStage.language = language;

  const leaderboard = await Assessment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$userId',
        language: { $first: '$language' },
        bestScore: { $max: '$score' },
        bestPercentage: { $max: '$percentage' },
        totalAttempts: { $sum: 1 },
      },
    },
    { $sort: { bestScore: -1, bestPercentage: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        college: '$user.college',
        language: 1,
        bestScore: 1,
        bestPercentage: 1,
        totalAttempts: 1,
      },
    },
  ]);

  const ranked = leaderboard.map((entry, idx) => ({ rank: idx + 1, ...entry }));

  await setCache(cacheKey, ranked, LEADERBOARD_TTL);
  res.json({ success: true, cached: false, data: ranked });
});

// @desc    Get student's rank
// @route   GET /api/leaderboard/my-rank
// @access  Student
export const getMyRank = asyncHandler(async (req, res) => {
  const { language } = req.query;
  const cacheKey = `rank:${req.user._id}:${language || 'all'}`;

  const cached = await getCache(cacheKey);
  if (cached) return res.json({ success: true, cached: true, data: cached });

  const matchStage = { status: 'completed' };
  if (language) matchStage.language = language;

  // ─── FIX: Avoid loading entire leaderboard into memory ────────────────────
  // BEFORE: Fetched ALL users' scores into a JS array, then .findIndex() — O(N) memory.
  // At 10,000 users this loads 10,000 documents into Node.js RAM.
  //
  // AFTER: Two targeted aggregations:
  //   1. Get this user's best score (O(1) with the userId+status index)
  //   2. Count users with a strictly better score (O(log N) with the index)
  // Memory usage: constant, regardless of total user count.

  // Step 1: Get the current user's best score
  const myBestResult = await Assessment.aggregate([
    { $match: { ...matchStage, userId: req.user._id } },
    { $group: { _id: null, bestScore: { $max: '$score' } } },
  ]);

  if (!myBestResult.length || myBestResult[0].bestScore == null) {
    return res.json({ success: true, data: { rank: null, total: 0 } });
  }

  const myBestScore = myBestResult[0].bestScore;

  // Step 2: Count users with a strictly better best score + total unique users
  const [betterCount, totalResult] = await Promise.all([
    Assessment.aggregate([
      { $match: matchStage },
      { $group: { _id: '$userId', bestScore: { $max: '$score' } } },
      { $match: { bestScore: { $gt: myBestScore } } },
      { $count: 'count' },
    ]),
    Assessment.aggregate([
      { $match: matchStage },
      { $group: { _id: '$userId' } },
      { $count: 'count' },
    ]),
  ]);

  const rank = (betterCount[0]?.count ?? 0) + 1;
  const total = totalResult[0]?.count ?? 0;

  const data = { rank, total };
  await setCache(cacheKey, data, RANK_TTL);
  res.json({ success: true, cached: false, data });
});

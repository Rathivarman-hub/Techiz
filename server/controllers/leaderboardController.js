import asyncHandler from 'express-async-handler';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';

// @desc    Get leaderboard (overall or by language)
// @route   GET /api/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { language, limit = 50 } = req.query;

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

  // Add ranks
  const ranked = leaderboard.map((entry, idx) => ({ rank: idx + 1, ...entry }));

  res.json({ success: true, data: ranked });
});

// @desc    Get student's rank
// @route   GET /api/leaderboard/my-rank
// @access  Student
export const getMyRank = asyncHandler(async (req, res) => {
  const { language } = req.query;
  const matchStage = { status: 'completed' };
  if (language) matchStage.language = language;

  const leaderboard = await Assessment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$userId',
        bestScore: { $max: '$score' },
        bestPercentage: { $max: '$percentage' },
      },
    },
    { $sort: { bestScore: -1 } },
  ]);

  const myIndex = leaderboard.findIndex(
    (entry) => entry._id.toString() === req.user._id.toString()
  );

  res.json({
    success: true,
    data: {
      rank: myIndex === -1 ? null : myIndex + 1,
      total: leaderboard.length,
    },
  });
});

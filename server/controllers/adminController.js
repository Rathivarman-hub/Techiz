import asyncHandler from 'express-async-handler';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import { Parser } from 'json2csv';
import { getCache, setCache, deleteCachePattern } from '../utils/cache.js';

// ─── Cache TTLs ───────────────────────────────────────────────────────────────
const STATS_TTL = 120;      // 2 minutes — stats tolerate slight staleness
const LANG_STATS_TTL = 120;
const TRENDS_TTL = 300;     // 5 minutes — trends change infrequently

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
export const getStats = asyncHandler(async (req, res) => {
  const cacheKey = 'admin:stats';
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ success: true, cached: true, data: cached });

  // WHY: Run all 4 DB queries in parallel — sequential would take 4x as long.
  const [totalStudents, totalAssessments, totalQuestions, avgScoreResult, passedCount] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      Assessment.countDocuments({ status: { $ne: 'in-progress' } }),
      Question.countDocuments(),
      Assessment.aggregate([
        { $match: { status: { $ne: 'in-progress' } } },
        { $group: { _id: null, avg: { $avg: '$percentage' }, total: { $sum: 1 }, passed: { $sum: { $cond: [{ $gte: ['$percentage', 40] }, 1, 0] } } } },
      ]),
      // Merged pass-rate into single aggregation above — eliminates extra DB call
    ]);

  const aggResult = avgScoreResult[0] || { avg: 0, total: 0, passed: 0 };
  const avgScore = Math.round(aggResult.avg || 0);
  const passRate = aggResult.total > 0 ? Math.round((aggResult.passed / aggResult.total) * 100) : 0;

  const data = { totalStudents, totalAssessments, totalQuestions, avgScore, passRate };
  await setCache(cacheKey, data, STATS_TTL);
  res.json({ success: true, cached: false, data });
});

// @desc    Get language popularity stats
// @route   GET /api/admin/language-stats
// @access  Admin
export const getLanguageStats = asyncHandler(async (req, res) => {
  const cacheKey = 'admin:langstats';
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ success: true, cached: true, data: cached });

  const stats = await Assessment.aggregate([
    { $match: { status: { $ne: 'in-progress' } } },
    { $group: { _id: '$language', count: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
    { $sort: { count: -1 } },
  ]);

  await setCache(cacheKey, stats, LANG_STATS_TTL);
  res.json({ success: true, cached: false, data: stats });
});

// @desc    Get all students with their stats
// @route   GET /api/admin/students
// @access  Admin
export const getStudents = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = { role: 'student' };

  if (search) {
    // Use $text search when available (full-text index), fall back to $regex
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, students] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).select('-password').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
  ]);

  // ─── FIX: N+1 Query ────────────────────────────────────────────────────────
  // BEFORE: one Assessment.aggregate() call per student (N+1 problem).
  // At 50 students that's 51 DB calls per page load. At 1000 students: 1001 calls.
  //
  // AFTER: one single aggregation for all students on the page.
  // Always exactly 2 DB calls regardless of page size.
  const studentIds = students.map((s) => s._id);
  const statsAgg = await Assessment.aggregate([
    { $match: { userId: { $in: studentIds }, status: { $ne: 'in-progress' } } },
    {
      $group: {
        _id: '$userId',
        attempts: { $sum: 1 },
        bestScore: { $max: '$score' },
        bestPct: { $max: '$percentage' },
      },
    },
  ]);

  const statsMap = {};
  statsAgg.forEach((s) => (statsMap[s._id.toString()] = s));

  const enriched = students.map((s) => ({
    ...s,
    assessmentStats: statsMap[s._id.toString()] || { attempts: 0, bestScore: 0, bestPct: 0 },
  }));

  res.json({ success: true, total, page: parseInt(page), data: enriched });
});

// @desc    Export students as CSV
// @route   GET /api/admin/export-students
// @access  Admin
export const exportStudents = asyncHandler(async (req, res) => {
  // WHY: Original fetches ALL students at once. This streams in pages to avoid
  // a memory spike that could crash the process with 10,000+ students.
  const PAGE_SIZE = 500;
  let page = 0;
  let allData = [];

  while (true) {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .lean()
      .skip(page * PAGE_SIZE)
      .limit(PAGE_SIZE);

    if (students.length === 0) break;

    const ids = students.map((s) => s._id);
    const assessments = await Assessment.aggregate([
      { $match: { userId: { $in: ids }, status: { $ne: 'in-progress' } } },
      { $group: { _id: '$userId', attempts: { $sum: 1 }, bestScore: { $max: '$score' }, bestPct: { $max: '$percentage' } } },
    ]);

    const aMap = {};
    assessments.forEach((a) => (aMap[a._id.toString()] = a));

    const rows = students.map((s) => {
      const a = aMap[s._id.toString()] || {};
      return {
        Name: s.name, Email: s.email, College: s.college, RollNumber: s.rollNumber,
        Attempts: a.attempts || 0, BestScore: a.bestScore || 0, BestPercentage: a.bestPct || 0,
        JoinedAt: s.createdAt,
      };
    });

    allData = allData.concat(rows);
    page++;
  }

  const parser = new Parser();
  const csv = parser.parse(allData);
  res.header('Content-Type', 'text/csv');
  res.attachment('techiz_students.csv');
  res.send(csv);
});

// @desc    Get monthly attempt trends
// @route   GET /api/admin/trends
// @access  Admin
export const getTrends = asyncHandler(async (req, res) => {
  const cacheKey = 'admin:trends';
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ success: true, cached: true, data: cached });

  const trends = await Assessment.aggregate([
    { $match: { status: { $ne: 'in-progress' }, completedAt: { $type: 'date' } } },
    {
      $group: {
        _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } },
        count: { $sum: 1 },
        avgScore: { $avg: '$percentage' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 },
  ]);

  await setCache(cacheKey, trends, TRENDS_TTL);
  res.json({ success: true, cached: false, data: trends });
});

// @desc    Update student assessment marks
// @route   PUT /api/admin/assessment/:assessmentId/marks
// @access  Admin
export const updateAssessmentMarks = asyncHandler(async (req, res) => {
  const { score, maxScore } = req.body;

  if (score === undefined || maxScore === undefined) {
    res.status(400);
    throw new Error('Score and maxScore are required');
  }

  if (score < 0 || maxScore < 0 || score > maxScore) {
    res.status(400);
    throw new Error('Invalid score values');
  }

  const assessment = await Assessment.findById(req.params.assessmentId);
  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  assessment.score = score;
  assessment.maxScore = maxScore;
  assessment.percentage = percentage;
  await assessment.save();

  // Invalidate leaderboard & stats caches since scores changed
  await Promise.all([
    deleteCachePattern('leaderboard:*'),
    deleteCachePattern('rank:*'),
    deleteCachePattern('admin:*'),
  ]);

  res.json({
    success: true,
    data: { assessmentId: assessment._id, score, maxScore, percentage, message: 'Marks updated successfully' },
  });
});

// @desc    Get student assessments for admin
// @route   GET /api/admin/students/:studentId/assessments
// @access  Admin
export const getStudentAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({
    userId: req.params.studentId,
    status: { $ne: 'in-progress' },
  })
    .select('language score maxScore percentage status completedAt')
    .sort({ completedAt: -1 });

  res.json({ success: true, data: assessments });
});

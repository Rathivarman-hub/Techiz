import asyncHandler from 'express-async-handler';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import { Parser } from 'json2csv';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
export const getStats = asyncHandler(async (req, res) => {
  const [totalStudents, totalAssessments, totalQuestions, avgScoreResult] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Assessment.countDocuments({ status: { $ne: 'in-progress' } }),
    Question.countDocuments(),
    Assessment.aggregate([
      { $match: { status: { $ne: 'in-progress' } } },
      { $group: { _id: null, avg: { $avg: '$percentage' } } },
    ]),
  ]);

  const avgScore = avgScoreResult[0]?.avg ? Math.round(avgScoreResult[0].avg) : 0;

  // Pass rate (>= 40%)
  const [passed, total] = await Promise.all([
    Assessment.countDocuments({ status: { $ne: 'in-progress' }, percentage: { $gte: 40 } }),
    Assessment.countDocuments({ status: { $ne: 'in-progress' } }),
  ]);
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  res.json({ success: true, data: { totalStudents, totalAssessments, totalQuestions, avgScore, passRate } });
});

// @desc    Get language popularity stats
// @route   GET /api/admin/language-stats
// @access  Admin
export const getLanguageStats = asyncHandler(async (req, res) => {
  const stats = await Assessment.aggregate([
    { $match: { status: { $ne: 'in-progress' } } },
    { $group: { _id: '$language', count: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data: stats });
});

// @desc    Get all students with their stats
// @route   GET /api/admin/students
// @access  Admin
export const getStudents = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = { role: 'student' };
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { college: { $regex: search, $options: 'i' } },
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(filter);
  const students = await User.find(filter).select('-password').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

  // Enrich with assessment count and best score
  const enriched = await Promise.all(
    students.map(async (s) => {
      const stats = await Assessment.aggregate([
        { $match: { userId: s._id, status: { $ne: 'in-progress' } } },
        { $group: { _id: null, attempts: { $sum: 1 }, bestScore: { $max: '$score' }, bestPct: { $max: '$percentage' } } },
      ]);
      return { ...s.toObject(), assessmentStats: stats[0] || { attempts: 0, bestScore: 0, bestPct: 0 } };
    })
  );

  res.json({ success: true, total, data: enriched });
});

// @desc    Export students as CSV
// @route   GET /api/admin/export-students
// @access  Admin
export const exportStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password').lean();
  const assessments = await Assessment.aggregate([
    { $match: { status: { $ne: 'in-progress' } } },
    { $group: { _id: '$userId', attempts: { $sum: 1 }, bestScore: { $max: '$score' }, bestPct: { $max: '$percentage' } } },
  ]);
  const assessmentMap = {};
  assessments.forEach((a) => (assessmentMap[a._id.toString()] = a));

  const data = students.map((s) => {
    const aStats = assessmentMap[s._id.toString()] || {};
    return {
      Name: s.name, Email: s.email, College: s.college, RollNumber: s.rollNumber,
      Attempts: aStats.attempts || 0, BestScore: aStats.bestScore || 0, BestPercentage: aStats.bestPct || 0,
      JoinedAt: s.createdAt,
    };
  });

  const parser = new Parser();
  const csv = parser.parse(data);
  res.header('Content-Type', 'text/csv');
  res.attachment('techiz_students.csv');
  res.send(csv);
});

// @desc    Get monthly attempt trends
// @route   GET /api/admin/trends
// @access  Admin
export const getTrends = asyncHandler(async (req, res) => {
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
  res.json({ success: true, data: trends });
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

  res.json({
    success: true,
    data: {
      assessmentId: assessment._id,
      score,
      maxScore,
      percentage,
      message: 'Marks updated successfully',
    },
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

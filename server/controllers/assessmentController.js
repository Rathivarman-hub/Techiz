import asyncHandler from 'express-async-handler';
import Assessment from '../models/Assessment.js';
import Question from '../models/Question.js';
import Certificate from '../models/Certificate.js';

const QUESTION_COUNT = 10;

// @desc    Start a new assessment (random 10 questions)
// @route   POST /api/assessments/start
// @access  Student
export const startAssessment = asyncHandler(async (req, res) => {
  const { language } = req.body;
  if (!language) { res.status(400); throw new Error('Language is required'); }

  // Get random 10 questions using $sample
  const questions = await Question.aggregate([
    { $match: { language } },
    { $sample: { size: QUESTION_COUNT } },
    { 
      $project: { 
        answer: 0, 
        explanation: 0,
        topics: 0,
        errorType: 0,
        errorExplanation: 0,
        correctCode: 0,
        learningTip: 0
      } 
    }, // hide answers, explanations, and learning system content from students
  ]);

  if (questions.length < QUESTION_COUNT) {
    res.status(400);
    throw new Error(`Not enough questions for ${language}. Found ${questions.length}, need ${QUESTION_COUNT}.`);
  }

  const questionIds = questions.map((q) => q._id);
  const maxScore = questions.reduce((sum, q) => {
    const marksMap = { mcq: 1, output: 2, syntax: 2, error: 2, coding: 5 };
    return sum + (marksMap[q.type] ?? 1);
  }, 0);

  const assessment = await Assessment.create({
    userId: req.user._id,
    language,
    questions: questionIds,
    maxScore,
  });

  res.status(201).json({
    success: true,
    data: {
      assessmentId: assessment._id,
      questions, // send questions without answers
      maxScore,
    },
  });
});

// @desc    Submit assessment answers
// @route   POST /api/assessments/:id/submit
// @access  Student
export const submitAssessment = asyncHandler(async (req, res) => {
  const { answers, status = 'completed' } = req.body; // answers: [{ questionId, selectedAnswer, timeTaken }]
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) { res.status(404); throw new Error('Assessment not found'); }
  if (assessment.userId.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  if (assessment.status !== 'in-progress') {
    res.status(400); throw new Error('Assessment already submitted');
  }

  // Fetch correct answers
  const questions = await Question.find({ _id: { $in: assessment.questions } });
  const questionMap = {};
  questions.forEach((q) => (questionMap[q._id.toString()] = q));

  const marksMap = { mcq: 1, output: 2, syntax: 2, error: 2, coding: 5 };

  let score = 0;
  const processedAnswers = (answers || []).map((a) => {
    const q = questionMap[a.questionId];
    const isCorrect = q && a.selectedAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
    if (isCorrect) score += marksMap[q.type] ?? 1;
    return { questionId: a.questionId, selectedAnswer: a.selectedAnswer, isCorrect, timeTaken: a.timeTaken || 0 };
  });

  const percentage = assessment.maxScore > 0 ? Math.round((score / assessment.maxScore) * 100) : 0;

  assessment.answers = processedAnswers;
  assessment.score = score;
  assessment.percentage = percentage;
  assessment.status = status;
  assessment.completedAt = new Date();
  await assessment.save();

  // Issue certificate if passed (>= 40%)
  let certificate = null;
  if (percentage >= 40) {
    certificate = await Certificate.create({
      userId: req.user._id,
      assessmentId: assessment._id,
      studentName: req.user.name,
      language: assessment.language,
      score,
      maxScore: assessment.maxScore,
      percentage,
    });
  }

  res.json({
    success: true,
    data: { status, assessmentId: assessment._id },
  });
});

// @desc    Get single assessment result
// @route   GET /api/assessments/:id
// @access  Private
export const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate('userId', 'name email college')
    .populate('answers.questionId');

  if (!assessment) { res.status(404); throw new Error('Assessment not found'); }

  const isOwner = assessment.userId._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) { res.status(403); throw new Error('Not authorized'); }

  // For students viewing their own results, hide topics, explanations, and learning content
  if (isOwner && !isAdmin) {
    assessment.answers = assessment.answers.map((a) => ({
      ...a.toObject?.() || a,
      questionId: {
        ...a.questionId.toObject?.() || a.questionId,
        answer: undefined,
        explanation: undefined,
        topics: undefined,
        errorType: undefined,
        errorExplanation: undefined,
        correctCode: undefined,
        learningTip: undefined
      }
    }));
  }

  res.json({ success: true, data: assessment });
});

// @desc    Get my assessments
// @route   GET /api/assessments/my
// @access  Student
export const getMyAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({ userId: req.user._id, status: { $ne: 'in-progress' } })
    .sort({ completedAt: -1 })
    .select('-answers -questions');

  res.json({ success: true, data: assessments });
});

// @desc    Get all assessments (admin)
// @route   GET /api/assessments
// @access  Admin
export const getAllAssessments = asyncHandler(async (req, res) => {
  const { language, page = 1, limit = 20 } = req.query;
  const filter = { status: { $ne: 'in-progress' } };
  if (language) filter.language = language;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Assessment.countDocuments(filter);
  const assessments = await Assessment.find(filter)
    .populate('userId', 'name email college rollNumber')
    .sort({ completedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('-answers -questions');

  res.json({ success: true, total, data: assessments });
});

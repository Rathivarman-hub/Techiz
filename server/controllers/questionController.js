import asyncHandler from 'express-async-handler';
import Question from '../models/Question.js';
import csv from 'csv-parser';
import fs from 'fs';
import { getCache, setCache, deleteCache, deleteCachePattern } from '../utils/cache.js';
import { normalizePagination, normalizeQuestionFilter } from '../utils/query.js';

const STATS_TTL = 300; // 5 minutes — question stats change infrequently
const QUESTIONS_LIST_TTL = 60;
const QUESTION_TTL = 300;

// @desc    Get all questions (admin) or filtered
// @route   GET /api/questions
// @access  Admin
export const getQuestions = asyncHandler(async (req, res) => {
  const filter = normalizeQuestionFilter(req);
  const { page, limit, skip, sort } = normalizePagination(req, 20);
  const cacheKey = `questions:list:${JSON.stringify({ filter, page, limit, sort })}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, cached: true, total: cached.total, page, limit, data: cached.data });
  }

  const [total, questions] = await Promise.all([
    Question.countDocuments(filter),
    Question.find(filter)
      .select('-__v')
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean(),
  ]);

  const payload = { success: true, cached: false, total, page, limit, data: questions };
  await setCache(cacheKey, payload, QUESTIONS_LIST_TTL);
  res.json(payload);
});

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Admin
export const getQuestion = asyncHandler(async (req, res) => {
  const cacheKey = `question:${req.params.id}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, cached: true, data: cached });
  }

  const question = await Question.findById(req.params.id).select('-__v').lean();
  if (!question) { res.status(404); throw new Error('Question not found'); }

  await setCache(cacheKey, question, QUESTION_TTL);
  res.json({ success: true, cached: false, data: question });
});

// @desc    Create question
// @route   POST /api/questions
// @access  Admin
export const createQuestion = asyncHandler(async (req, res) => {
  const question = await Question.create(req.body);
  await Promise.all([
    deleteCache('questions:stats'),
    deleteCachePattern('questions:list:*'),
    deleteCachePattern('question:*'),
  ]);
  res.status(201).json({ success: true, data: question });
});

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Admin
export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!question) { res.status(404); throw new Error('Question not found'); }
  await Promise.all([
    deleteCache('questions:stats'),
    deleteCachePattern('questions:list:*'),
    deleteCachePattern('question:*'),
  ]);
  res.json({ success: true, data: question });
});

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Admin
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) { res.status(404); throw new Error('Question not found'); }
  await Promise.all([
    deleteCache('questions:stats'),
    deleteCachePattern('questions:list:*'),
    deleteCachePattern('question:*'),
  ]);
  res.json({ success: true, message: 'Question deleted' });
});

// @desc    Bulk upload questions via JSON or CSV
// @route   POST /api/questions/bulk
// @access  Admin
export const bulkUpload = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) { res.status(400); throw new Error('No file uploaded'); }

  let questions = [];

  if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
    questions = JSON.parse(fs.readFileSync(file.path, 'utf8'));
  } else if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (row) => {
          if (row.options) {
            try { row.options = JSON.parse(row.options); } catch { row.options = row.options.split('|'); }
          }
          questions.push(row);
        })
        .on('end', () => {
          fs.unlinkSync(file.path);
          resolve();
        })
        .on('error', (err) => {
          fs.unlinkSync(file.path);
          reject(err);
        });
    });
  } else {
    fs.unlinkSync(file.path);
    res.status(400);
    throw new Error('Only JSON or CSV files are supported');
  }

  if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
    fs.unlinkSync(file.path);
  }

  const inserted = await Question.insertMany(questions, { ordered: false });
  await deleteCache('questions:stats');
  res.status(201).json({ success: true, inserted: inserted.length });
});

// @desc    Get question count by language
// @route   GET /api/questions/stats
// @access  Admin
export const getQuestionStats = asyncHandler(async (req, res) => {
  const cacheKey = 'questions:stats';
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ success: true, cached: true, data: cached });

  const stats = await Question.aggregate([
    { $group: { _id: { language: '$language', type: '$type' }, count: { $sum: 1 } } },
  ]);

  await setCache(cacheKey, stats, STATS_TTL);
  res.json({ success: true, cached: false, data: stats });
});

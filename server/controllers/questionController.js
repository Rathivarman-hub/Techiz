import asyncHandler from 'express-async-handler';
import Question from '../models/Question.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

// @desc    Get all questions (admin) or filtered
// @route   GET /api/questions
// @access  Admin
export const getQuestions = asyncHandler(async (req, res) => {
  const { language, type, difficulty, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (language) filter.language = language;
  if (type) filter.type = type;
  if (difficulty) filter.difficulty = difficulty;
  if (search) filter.question = { $regex: search, $options: 'i' };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Question.countDocuments(filter);
  const questions = await Question.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

  res.json({ success: true, total, page: parseInt(page), data: questions });
});

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Admin
export const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) { res.status(404); throw new Error('Question not found'); }
  res.json({ success: true, data: question });
});

// @desc    Create question
// @route   POST /api/questions
// @access  Admin
export const createQuestion = asyncHandler(async (req, res) => {
  const question = await Question.create(req.body);
  res.status(201).json({ success: true, data: question });
});

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Admin
export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!question) { res.status(404); throw new Error('Question not found'); }
  res.json({ success: true, data: question });
});

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Admin
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) { res.status(404); throw new Error('Question not found'); }
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
    questions = JSON.parse(file.buffer.toString());
  } else if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    await new Promise((resolve, reject) => {
      const stream = Readable.from(file.buffer.toString());
      stream.pipe(csv())
        .on('data', (row) => {
          if (row.options) {
            try { row.options = JSON.parse(row.options); } catch { row.options = row.options.split('|'); }
          }
          questions.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
  } else {
    res.status(400);
    throw new Error('Only JSON or CSV files are supported');
  }

  const inserted = await Question.insertMany(questions, { ordered: false });
  res.status(201).json({ success: true, inserted: inserted.length });
});

// @desc    Get question count by language
// @route   GET /api/questions/stats
// @access  Admin
export const getQuestionStats = asyncHandler(async (req, res) => {
  const stats = await Question.aggregate([
    { $group: { _id: { language: '$language', type: '$type' }, count: { $sum: 1 } } },
  ]);
  res.json({ success: true, data: stats });
});

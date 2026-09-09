import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getQuestions, getQuestion, createQuestion, updateQuestion,
  deleteQuestion, bulkUpload, getQuestionStats,
} from '../controllers/questionController.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = file.mimetype === 'application/json' || file.mimetype === 'text/csv' || file.originalname.endsWith('.csv') || file.originalname.endsWith('.json');
    if (!allowed) return cb(new Error('Only JSON or CSV files are supported'));
    cb(null, true);
  },
});

router.use(protect, adminOnly);
router.get('/stats', getQuestionStats);
router.route('/').get(getQuestions).post(createQuestion);
router.post('/bulk', upload.single('file'), bulkUpload);
router.route('/:id').get(getQuestion).put(updateQuestion).delete(deleteQuestion);

export default router;

import express from 'express';
const router = express.Router();
import multer from 'multer';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getQuestions, getQuestion, createQuestion, updateQuestion,
  deleteQuestion, bulkUpload, getQuestionStats,
} from '../controllers/questionController.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect, adminOnly);
router.get('/stats', getQuestionStats);
router.route('/').get(getQuestions).post(createQuestion);
router.post('/bulk', upload.single('file'), bulkUpload);
router.route('/:id').get(getQuestion).put(updateQuestion).delete(deleteQuestion);

export default router;

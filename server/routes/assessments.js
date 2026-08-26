import express from 'express';
const router = express.Router();
import { protect, adminOnly } from '../middleware/auth.js';
import {
  startAssessment, submitAssessment, getAssessment,
  getMyAssessments, getAllAssessments,
} from '../controllers/assessmentController.js';

router.post('/start', protect, startAssessment);
router.get('/my', protect, getMyAssessments);
router.get('/', protect, adminOnly, getAllAssessments);
router.get('/:id', protect, getAssessment);
router.post('/:id/submit', protect, submitAssessment);

export default router;

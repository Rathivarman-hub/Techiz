import express from 'express';
const router = express.Router();
import { protect, adminOnly } from '../middleware/auth.js';
import { 
  getStats, 
  getLanguageStats, 
  getStudents, 
  exportStudents, 
  getTrends,
  updateAssessmentMarks,
  getStudentAssessments
} from '../controllers/adminController.js';

router.use(protect, adminOnly);
router.get('/stats', getStats);
router.get('/language-stats', getLanguageStats);
router.get('/trends', getTrends);
router.get('/students', getStudents);
router.get('/students/:studentId/assessments', getStudentAssessments);
router.put('/assessment/:assessmentId/marks', updateAssessmentMarks);
router.get('/export-students', exportStudents);

export default router;

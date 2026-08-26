import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth.js';
import { getMyCertificates, getCertificate } from '../controllers/certificateController.js';

router.get('/my', protect, getMyCertificates);
router.get('/:id', protect, getCertificate);

export default router;

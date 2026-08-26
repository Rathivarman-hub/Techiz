import express from 'express';
const router = express.Router();
import { protect, adminOnly } from '../middleware/auth.js';
import { getLeaderboard, getMyRank } from '../controllers/leaderboardController.js';

router.get('/', protect, adminOnly, getLeaderboard);
router.get('/my-rank', protect, adminOnly, getMyRank);

export default router;

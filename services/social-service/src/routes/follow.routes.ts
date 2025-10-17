import { Router } from 'express';
import { followController } from '../controllers/follow.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/follow', authenticateToken, followController.follow.bind(followController));
router.delete('/follow/:targetUserId', authenticateToken, followController.unfollow.bind(followController));
router.get('/follow/:targetUserId', authenticateToken, followController.isFollowing.bind(followController));
router.get('/followers/:userId', followController.getFollowers.bind(followController));
router.get('/following/:userId', followController.getFollowing.bind(followController));
router.get('/counts/:userId', followController.getCounts.bind(followController));

export default router;

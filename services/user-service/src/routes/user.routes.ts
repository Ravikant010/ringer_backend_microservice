import { Router } from 'express'
import { userController } from '../controllers/user.controller'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import z from 'zod'
import { userService } from '../services/user.service'

const router = Router()

// Public routes (with optional authentication)
router.get('/test', (req, res) => res.send("User Service is running"))
router.get('/profile/:userId', optionalAuth, userController.getProfile)
router.get('/search', userController.searchUsers)

// Protected routes
router.put('/profile', authenticateToken, userController.updateProfile)
router.post('/follow/:userId', authenticateToken, userController.followUser)
router.delete('/follow/:userId', authenticateToken, userController.unfollowUser)
router.get('/:userId/followers', optionalAuth, userController.getFollowers)
router.get('/:userId/following', optionalAuth, userController.getFollowing)
const BatchSchema = z.object({
  ids: z.array(z.string().min(1)).nonempty().max(10000),
});

router.post('/batch', async (req, res) => {
  try {
    const { ids } = BatchSchema.parse(req.body);
    const users = await userService.getUsersBatch(ids); // preserves input order
    res.status(200).json({ users });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid body', details: err.issues });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    console.log('Authenticated userId:', userId);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // Minimal profile for convenience; or return only { id }
    const profile = await userService.getUserProfile(userId);
    return res.json({
      success: true,
      data: {
        id: profile.id,
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        isVerified: profile.isVerified,
        isOnline: profile.isOnline,
      },
    });
  } catch {
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


export default router
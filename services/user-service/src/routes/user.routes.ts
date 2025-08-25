import { Router } from 'express'
import { userController } from '../controllers/user.controller'
import { authenticateToken, optionalAuth } from '../middleware/auth'

const router = Router()

// Public routes (with optional authentication)
router.get('/test', (req, res)=>res.send("User Service is running"))
router.get('/profile/:userId', optionalAuth, userController.getProfile)
router.get('/search', userController.searchUsers)

// Protected routes
router.put('/profile', authenticateToken, userController.updateProfile)
router.post('/follow/:userId', authenticateToken, userController.followUser)
router.delete('/follow/:userId', authenticateToken, userController.unfollowUser)
router.get('/:userId/followers', optionalAuth, userController.getFollowers)
router.get('/:userId/following', optionalAuth, userController.getFollowing)

export default router
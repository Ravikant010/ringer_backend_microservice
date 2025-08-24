import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { authenticateToken } from '../middleware/auth'
import rateLimit from 'express-rate-limit'

const router = Router()

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit refresh token requests
  message: {
    success: false,
    error: 'Too many token refresh attempts, please try again later.',
    code: 'REFRESH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Public routes
router.post('/register', authLimiter, authController.register)
router.post('/login', authLimiter, authController.login)
router.post('/refresh-token', refreshLimiter, authController.refreshTokens)

// Protected routes
router.post('/logout', authenticateToken, authController.logout)
router.get('/me', authenticateToken, authController.getMe)
router.put('/change-password', authenticateToken, authController.changePassword)

export default router

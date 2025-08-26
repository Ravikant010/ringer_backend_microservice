import { Router } from 'express'
import { notificationController } from '../controllers'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Ingest endpoints (could be protected by an internal secret or service token)
router.post('/notify/comment-created', notificationController.ingestCommentCreated.bind(notificationController))
router.post('/notify/reply-created', notificationController.ingestReplyCreated.bind(notificationController))

// User-facing inbox
router.get('/notifications', authenticateToken, notificationController.listMyNotifications.bind(notificationController))
router.post('/notifications/:id/read', authenticateToken, notificationController.markRead.bind(notificationController))
router.post('/notifications/read-all', authenticateToken, notificationController.markAllRead.bind(notificationController))

export default router

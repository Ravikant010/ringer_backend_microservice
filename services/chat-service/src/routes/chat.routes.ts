import { Router } from 'express'
import { chatController } from '../controllers/chat.controller'
import { authenticateToken } from '../middleware/auth'

const router = Router()

router.post('/messages', authenticateToken, chatController.sendMessage.bind(chatController))
router.get('/messages', authenticateToken, chatController.getMessages.bind(chatController))
router.get('/conversations', authenticateToken, chatController.getConversations.bind(chatController))
router.post('/messages/read', authenticateToken, chatController.markAsRead.bind(chatController))

export default router

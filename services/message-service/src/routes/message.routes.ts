import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Send a message
router.post('/messages', messageController.sendMessage.bind(messageController));

// Get all conversations
router.get('/conversations', messageController.getConversations.bind(messageController));

// Get conversation with specific user
router.get('/conversations/user/:otherUserId', messageController.getConversationWithUser.bind(messageController));

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', messageController.getMessages.bind(messageController));

// Mark conversation as read
router.patch('/conversations/:conversationId/read', messageController.markAsRead.bind(messageController));

// Get unread count
router.get('/unread-count', messageController.getUnreadCount.bind(messageController));

export default router;

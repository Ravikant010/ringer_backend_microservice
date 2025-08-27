import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'
import { chatRepository } from '../repo/chat.repository'
import { SendMessageSchema, GetMessagesSchema, GetConversationsSchema, MarkAsReadSchema } from '../validation/chat.schemas'

class ChatController {
  async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const senderId = req.user!.userId
      const { receiverId, content } = SendMessageSchema.parse(req.body)
      
      const message = await chatRepository.sendMessage(senderId, receiverId, content)
      
      res.status(201).json({ success: true, data: message })
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Failed to send message', code: 'SEND_MESSAGE_FAILED' })
    }
  }

  async getMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId
      const { userId: otherUserId, limit, cursor } = GetMessagesSchema.parse(req.query)
      
      const page = await chatRepository.getConversationMessages(userId, otherUserId, limit, cursor)
      
      res.json({ 
        success: true, 
        data: page.items, 
        pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore } 
      })
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Failed to get messages', code: 'GET_MESSAGES_FAILED' })
    }
  }

  async getConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId
      const { limit, cursor } = GetConversationsSchema.parse(req.query)
      
      const page = await chatRepository.getUserConversations(userId, limit, cursor)
      
      res.json({ 
        success: true, 
        data: page.items, 
        pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore } 
      })
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Failed to get conversations', code: 'GET_CONVERSATIONS_FAILED' })
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId
      const { messageIds } = MarkAsReadSchema.parse(req.body)
      
      await chatRepository.markMessagesAsRead(userId, messageIds)
      
      res.json({ success: true, message: 'Messages marked as read' })
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Failed to mark as read', code: 'MARK_READ_FAILED' })
    }
  }
}

export const chatController = new ChatController()

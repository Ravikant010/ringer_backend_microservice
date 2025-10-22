import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { chatRepository } from '../repo/chat.repository';
import { SendMessageSchema, GetMessagesSchema, GetConversationsSchema, MarkAsReadSchema } from '../validation/chat.schemas';

// ✅ Import socketHandler (will be available after server starts)
let socketHandler: any;
import('../index').then(module => {
  socketHandler = module.socketHandler;
});

class ChatController {
  async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const senderId = req.user!.userId;
      const { receiverId, content } = SendMessageSchema.parse(req.body);

      const message = await chatRepository.sendMessage(senderId, receiverId, content);

      res.status(201).json({ success: true, data: message });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Failed to send message', code: 'SEND_MESSAGE_FAILED' });
    }
  }

  async getMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { userId: otherUserId, limit, cursor } = GetMessagesSchema.parse(req.query);

      const page = await chatRepository.getConversationMessages(userId, otherUserId, limit, cursor);

      res.json({
        success: true,
        data: page.items,
        pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore }
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Failed to get messages', code: 'GET_MESSAGES_FAILED' });
    }
  }

  async getConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { limit, cursor } = GetConversationsSchema.parse(req.query);

      const page = await chatRepository.getUserConversations(userId, limit, cursor);

      res.json({
        success: true,
        data: page.items,
        pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore }
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Failed to get conversations', code: 'GET_CONVERSATIONS_FAILED' });
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { messageIds } = MarkAsReadSchema.parse(req.body);

      await chatRepository.markMessagesAsRead(userId, messageIds);

      res.json({ success: true, message: 'Messages marked as read' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Failed to mark as read', code: 'MARK_READ_FAILED' });
    }
  }

  async createOrGetRoom(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { participantIds } = req.body;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length !== 2) {
        return res.status(400).json({
          success: false,
          error: 'participantIds must be an array of 2 user IDs'
        });
      }

      const [user1, user2] = participantIds.sort();
      const roomId = `${user1}__${user2}`;

      console.log('✅ Room created/retrieved:', roomId);

      res.json({
        success: true,
        data: {
          id: roomId,
          participants: participantIds,
          createdAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message ?? 'Failed to create room'
      });
    }
  }

  async getRoomMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { roomId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const [user1Id, user2Id] = roomId.split('__');

      if (!user1Id || !user2Id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid room ID format. Expected: userId1__userId2'
        });
      }

      console.log(`📥 Fetching messages for room: ${roomId}`);

      const result = await chatRepository.getConversationMessages(
        user1Id,
        user2Id,
        limit
      );

      res.json({
        success: true,
        data: result.items || []
      });
    } catch (err: any) {
      console.error('Get room messages error:', err);
      res.status(400).json({
        success: false,
        error: err.message ?? 'Failed to get room messages'
      });
    }
  }

  // ✅ FIXED: Emit socket events to receiver
  async sendRoomMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const senderId = req.user!.userId;
      const { roomId } = req.params;
      const { content } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
      }

      const [user1Id, user2Id] = roomId.split('__');

      if (!user1Id || !user2Id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid room ID format. Expected: userId1__userId2'
        });
      }

      const receiverId = senderId === user1Id ? user2Id : user1Id;

      console.log(`📤 Sending message: ${senderId} -> ${receiverId}`);

      const message = await chatRepository.sendMessage(senderId, receiverId, content);

      // ✅ Emit socket event to receiver (if socketHandler is initialized)
      if (socketHandler) {
        const sent = socketHandler.emitToUser(receiverId, 'new_message', { message });

        if (sent) {
          console.log('✅ Real-time message delivered to receiver');
        } else {
          console.log('⚠️ Receiver not online');
        }
      }

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (err: any) {
      console.error('Send room message error:', err);
      res.status(400).json({
        success: false,
        error: err.message ?? 'Failed to send message'
      });
    }
  }
}

export const chatController = new ChatController();

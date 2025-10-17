import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { messageRepository } from '../repositories/message.repository';
import { env } from '../config/env';

class MessageController {
    // Send a message
    async sendMessage(req: AuthenticatedRequest, res: Response) {
        try {
            const senderId = req.user!.userId;
            const { recipientId, content } = req.body;

            if (!recipientId || !content) {
                return res.status(400).json({
                    success: false,
                    error: 'recipientId and content are required',
                });
            }

            if (senderId === recipientId) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot send message to yourself',
                });
            }

            // Get or create conversation
            const conversation = await messageRepository.getOrCreateConversation(senderId, recipientId);

            // Send message
            const message = await messageRepository.sendMessage(
                conversation.id,
                senderId,
                content.trim()
            );

            res.status(201).json({
                success: true,
                data: message,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    // Get messages for a conversation
    async getMessages(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const { conversationId } = req.params;
            const limit = parseInt(req.query.limit as string) || 50;

            const messages = await messageRepository.getMessages(conversationId, limit);

            // Mark messages as read
            await messageRepository.markAsRead(conversationId, userId);

            res.json({
                success: true,
                data: messages.reverse(), // Oldest first for chat display
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    // Get all conversations for a user
    async getConversations(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const limit = parseInt(req.query.limit as string) || 20;

            const conversations = await messageRepository.getConversations(userId, limit);

            // Enrich with user data and last message
            const enrichedConversations = await Promise.all(
                conversations.map(async (conv) => {
                    const otherUserId =
                        conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;

                    // Fetch other user's data
                    const userResponse = await fetch(`${env.userServiceUrl}/api/v1/users/${otherUserId}`, {
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const userData = await userResponse.json();

                    // Get last message
                    const lastMessages = await messageRepository.getMessages(conv.id, 1);
                    const lastMessage = lastMessages[0] || null;

                    return {
                        ...conv,
                        otherUser: userData.data || userData,
                        lastMessage,
                    };
                })
            );

            res.json({
                success: true,
                data: enrichedConversations,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    // Get conversation with a specific user
    async getConversationWithUser(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const { otherUserId } = req.params;

            const conversation = await messageRepository.getOrCreateConversation(userId, otherUserId);

            res.json({
                success: true,
                data: conversation,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    // Get unread message count
    async getUnreadCount(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;

            const count = await messageRepository.getUnreadCount(userId);

            res.json({
                success: true,
                data: { unreadCount: count },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    // Mark conversation as read
    async markAsRead(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const { conversationId } = req.params;

            await messageRepository.markAsRead(conversationId, userId);

            res.json({
                success: true,
                message: 'Messages marked as read',
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
}

export const messageController = new MessageController();

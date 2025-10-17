import { eq, and, or, desc, sql } from 'drizzle-orm';
import { db } from '../database';
import { conversations, messages } from '../database/schema';
import { kafkaService } from '../events/kafka.service';
import { TOPICS } from '../events/types';

export class MessageRepository {
    async getOrCreateConversation(user1Id: string, user2Id: string) {
        const [smaller, larger] = [user1Id, user2Id].sort();

        let [conversation] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.participant1Id, smaller),
                    eq(conversations.participant2Id, larger)
                )
            )
            .limit(1);

        if (!conversation) {
            [conversation] = await db
                .insert(conversations)
                .values({
                    participant1Id: smaller,
                    participant2Id: larger,
                })
                .returning();
        }

        return conversation;
    }

    async sendMessage(conversationId: string, senderId: string, content: string) {
        const [message] = await db
            .insert(messages)
            .values({
                conversationId,
                senderId,
                content,
            })
            .returning();

        await db
            .update(conversations)
            .set({ lastMessageAt: new Date() })
            .where(eq(conversations.id, conversationId));

        await kafkaService.publishEvent(TOPICS.MESSAGE_SENT, {
            eventType: 'message.sent',
            messageId: message.id,
            conversationId,
            senderId,
            timestamp: new Date().toISOString(),
        });

        return message;
    }

    async getMessages(conversationId: string, limit: number = 50) {
        return await db
            .select()
            .from(messages)
            .where(
                and(
                    eq(messages.conversationId, conversationId),
                    eq(messages.isDeleted, false)
                )
            )
            .orderBy(desc(messages.createdAt))
            .limit(limit);
    }

    async getConversations(userId: string, limit: number = 20) {
        return await db
            .select()
            .from(conversations)
            .where(
                or(
                    eq(conversations.participant1Id, userId),
                    eq(conversations.participant2Id, userId)
                )
            )
            .orderBy(desc(conversations.lastMessageAt))
            .limit(limit);
    }

    async markAsRead(conversationId: string, userId: string) {
        await db
            .update(messages)
            .set({ isRead: true })
            .where(
                and(
                    eq(messages.conversationId, conversationId),
                    sql`${messages.senderId} != ${userId}`,
                    eq(messages.isRead, false)
                )
            );
    }

    async getUnreadCount(userId: string): Promise<number> {
        const userConversations = await db
            .select({ id: conversations.id })
            .from(conversations)
            .where(
                or(
                    eq(conversations.participant1Id, userId),
                    eq(conversations.participant2Id, userId)
                )
            );

        const conversationIds = userConversations.map(c => c.id);

        if (conversationIds.length === 0) return 0;

        const [result] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(messages)
            .where(
                and(
                    sql`${messages.conversationId} = ANY(${conversationIds})`,
                    sql`${messages.senderId} != ${userId}`,
                    eq(messages.isRead, false)
                )
            );

        return result?.count || 0;
    }
}

export const messageRepository = new MessageRepository();

import { and, desc, eq, or, lt, sql } from 'drizzle-orm'
import { db } from '../database'
import { messages, conversations, userPresence } from '../database/schema'

export class ChatRepository {
  async sendMessage(senderId: string, receiverId: string, content: string) {
    const [message] = await db.insert(messages).values({
      senderId,
      receiverId,
      content,
      status: 'sent',
    }).returning()

    // Update or create conversation
    await this.updateConversation(senderId, receiverId, message.id, message.createdAt)
    
    return message
  }

  async getConversationMessages(user1Id: string, user2Id: string, limit: number, cursor?: string) {
    const where = cursor
      ? and(
          or(
            and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
            and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
          ),
          lt(messages.id, cursor)
        )
      : or(
          and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
          and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
        )

    const rows = await db.select().from(messages)
      .where(where as any)
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? items[items.length - 1].id : undefined
    
    return { items, nextCursor, hasMore }
  }

  async getUserConversations(userId: string, limit: number, cursor?: string) {
    const where = cursor
      ? and(
          or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)),
          lt(conversations.id, cursor)
        )
      : or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId))

    const rows = await db.select().from(conversations)
      .where(where as any)
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.id))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? items[items.length - 1].id : undefined
    
    return { items, nextCursor, hasMore }
  }

  async markMessagesAsRead(userId: string, messageIds: string[]) {
    await db.update(messages)
      .set({ status: 'read', updatedAt: new Date() })
      .where(
        and(
          eq(messages.receiverId, userId),
          sql`${messages.id} = ANY(${messageIds})`
        )
      )
  }

  async markMessagesAsDelivered(receiverId: string) {
    await db.update(messages)
      .set({ status: 'delivered', updatedAt: new Date() })
      .where(
        and(
          eq(messages.receiverId, receiverId),
          eq(messages.status, 'sent')
        )
      )
  }

  private async updateConversation(user1Id: string, user2Id: string, messageId: string, messageAt: Date) {
    // Ensure consistent ordering for unique constraint
    const [smallerId, largerId] = [user1Id, user2Id].sort()
    
    await db.insert(conversations)
      .values({
        user1Id: smallerId,
        user2Id: largerId,
        lastMessageId: messageId,
        lastMessageAt: messageAt,
      })
      .onConflictDoUpdate({
        target: [conversations.user1Id, conversations.user2Id],
        set: {
          lastMessageId: messageId,
          lastMessageAt: messageAt,
          updatedAt: new Date(),
        },
      })
  }

  async updatePresence(userId: string, isOnline: boolean, socketId?: string) {
    await db.insert(userPresence)
      .values({
        userId,
        isOnline,
        socketId,
        lastSeen: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPresence.userId,
        set: {
          isOnline,
          socketId: socketId || null,
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
      })
  }

  async getUserPresence(userId: string) {
    const [presence] = await db.select().from(userPresence)
      .where(eq(userPresence.userId, userId))
      .limit(1)
    return presence
  }
}

export const chatRepository = new ChatRepository()

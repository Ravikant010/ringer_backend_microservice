import { db } from './index'
import { notifications } from './schema'
import { and, desc, eq, lt } from 'drizzle-orm'

export class NotificationRepository {
  async create(data: {
    userId: string; actorId: string; postId?: string; commentId?: string;
    type: 'comment_on_post'|'reply_on_comment'|'post_liked'|'comment_liked'|'new_follower';
    title: string; body: string;
  }) {
    const [row] = await db.insert(notifications).values(data).returning()
    return row
  }

  async list(userId: string, limit: number, cursor?: string) {
    const where = cursor
      ? and(eq(notifications.userId, userId), lt(notifications.id, cursor))
      : eq(notifications.userId, userId)
    const rows = await db.select().from(notifications)
      .where(where as any)
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit + 1)
    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? items[items.length - 1].id : undefined
    return { items, nextCursor, hasMore }
  }

  async markRead(userId: string, id: string) {
    const { notifications: n } = await import('./schema') // avoid circular
    const [row] = await db.update(n)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(n.id, id), eq(n.userId, userId)))
      .returning()
    return row
  }

  async markAllRead(userId: string) {
    const { notifications: n } = await import('./schema')
    await db.update(n).set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(n.userId, userId), eq(n.isRead, false as any)))
  }
}

export const notificationRepo = new NotificationRepository()

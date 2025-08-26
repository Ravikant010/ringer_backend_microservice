import { and, desc, eq, isNull, lt } from 'drizzle-orm'  // [3]
import { db } from '../database'
import { comments, commentLikes } from '../database/schema'

export class CommentRepository {
  async create(authorId: string, data: { postId: string; content: string; parentId?: string }) {
    if (data.parentId) {
      const [parent] = await db.select().from(comments).where(eq(comments.id, data.parentId)).limit(1)
      if (!parent || parent.postId !== data.postId) {
        throw new Error('Parent comment not found or mismatched post')
      }
    }
    const [row] = await db.insert(comments).values({
      postId: data.postId,
      authorId,
      parentId: data.parentId,
      content: data.content,
    }).returning()
    return row
  }

  async getById(id: string) {
    const rows = await db.query.comments.findMany({
      where: (c, { eq }) => eq(c.id, id),
      limit: 1,
      with: { likes: false },
    })
    return rows ?? null
  }

  async listByPost(postId: string, limit: number, cursor?: string) {
    const base = eq(comments.postId, postId)
    const rootOnly = isNull(comments.parentId)
    const where = cursor ? and(base, rootOnly, lt(comments.id, cursor)) : and(base, rootOnly)
    const rows = await db.select().from(comments)
      .where(where as any)
      .orderBy(desc(comments.createdAt), desc(comments.id))
      .limit(limit + 1)
    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? items[items.length - 1].id : undefined
    return { items, nextCursor, hasMore }
  }

  async listReplies(parentId: string, limit: number, cursor?: string) {
    const where = cursor ? and(eq(comments.parentId, parentId), lt(comments.id, cursor)) : eq(comments.parentId, parentId)
    const rows = await db.select().from(comments)
      .where(where as any)
      .orderBy(desc(comments.createdAt), desc(comments.id))
      .limit(limit + 1)
    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? items[items.length - 1].id : undefined
    return { items, nextCursor, hasMore }
  }

  async like(commentId: string, userId: string) {
    try {
      await db.insert(commentLikes).values({ commentId, userId })
    } catch {
      // unique conflict -> idempotent
    }
    return { success: true }
  }

  async unlike(commentId: string, userId: string) {
    await db.delete(commentLikes).where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)))
    return { success: true }
  }
}

export const commentRepository = new CommentRepository()

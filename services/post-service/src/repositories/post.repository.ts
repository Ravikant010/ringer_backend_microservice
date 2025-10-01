import { and, desc, eq, lt } from 'drizzle-orm'
import { db } from '../database'
import { posts, postLikes } from '../database/schema'

export class PostRepository {
  async create(authorId: string, data: { content: string; mediaUrl?: string; visibility?: 'public' | 'followers' | 'private' }) {
    const [row] = await db.insert(posts).values({
      authorId, content: data.content, mediaUrl: data.mediaUrl, visibility: (data.visibility ?? 'public') as any,
    }).returning()
    return row
  }

  async getById(id: string) {
    const rows = await db.query.posts.findMany({
      where: (p, { eq }) => eq(p.id, id),
      limit: 1,
      with: { likes: false },
    })
    return rows ?? null
  }

  async listByAuthor(authorId: string, limit: number, cursor?: string) {
    // Simple cursor on id desc; swap to (createdAt,id) pair for stable pagination later
    const where = cursor ? and(eq(posts.authorId, authorId), lt(posts.id, cursor)) : eq(posts.authorId, authorId)
    const rows = await db.select().from(posts)
      .where(where as any)
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit + 1)
    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? items[items.length - 1].id : undefined
    return { items, nextCursor, hasMore }
  }

  async like(postId: string, userId: string) {
    try {
      await db.insert(postLikes).values({ postId, userId })
    } catch (_) {
      // unique conflict => idempotent like
    }
    return { success: true }
  }

  async unlike(postId: string, userId: string) {
    await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
    return { success: true }
  }

  async listAll(limit: number, cursor?: string) {
    // Cursor-based pagination on createdAt and id for stable results
    const where = cursor ? lt(posts.createdAt, new Date(cursor)) : undefined

    const rows = await db.select().from(posts)
      .where(where as any)
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit + 1) // get extra to check for more

    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    // Next cursor is createdAt of last item, converted to ISO string for client
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : undefined

    return { items, nextCursor, hasMore }
  }



}

export const postRepository = new PostRepository()

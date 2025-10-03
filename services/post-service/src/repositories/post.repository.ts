// import { and, desc, eq, lt } from 'drizzle-orm'
// import { db } from '../database'
// import { posts, postLikes } from '../database/schema'

// export class PostRepository {
//   async create(authorId: string, data: { content: string; mediaUrl?: string; visibility?: 'public' | 'followers' | 'private' }) {
//     const [row] = await db.insert(posts).values({
//       authorId, content: data.content, mediaUrl: data.mediaUrl, visibility: (data.visibility ?? 'public') as any,
//     }).returning()
//     return row
//   }

//   async getById(id: string) {
//     const rows = await db.query.posts.findMany({
//       where: (p, { eq }) => eq(p.id, id),
//       limit: 1,
//       with: { likes: false },
//     })
//     return rows ?? null
//   }

//   async listByAuthor(authorId: string, limit: number, cursor?: string) {
//     // Simple cursor on id desc; swap to (createdAt,id) pair for stable pagination later
//     const where = cursor ? and(eq(posts.authorId, authorId), lt(posts.id, cursor)) : eq(posts.authorId, authorId)
//     const rows = await db.select().from(posts)
//       .where(where as any)
//       .orderBy(desc(posts.createdAt), desc(posts.id))
//       .limit(limit + 1)
//     const hasMore = rows.length > limit
//     const items = hasMore ? rows.slice(0, limit) : rows
//     const nextCursor = hasMore ? items[items.length - 1].id : undefined
//     return { items, nextCursor, hasMore }
//   }

//   async like(postId: string, userId: string) {
//     try {
//       await db.insert(postLikes).values({ postId, userId })
//     } catch (_) {
//       // unique conflict => idempotent like
//     }
//     return { success: true }
//   }

//   async unlike(postId: string, userId: string) {
//     await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
//     return { success: true }
//   }

//   async listAll(limit: number, cursor?: string) {
//     const where = cursor ? lt(posts.createdAt, new Date(cursor)) : undefined;

//     const rows = await db
//       .select({
//         postId: posts.id,
//         postContent: posts.content,
//         postMediaUrl: posts.mediaUrl,
//         postVisibility: posts.visibility,
//         postLikeCount: posts.likeCount,
//         postCommentCount: posts.commentCount,
//         postIsDeleted: posts.isDeleted,
//         postCreatedAt: posts.createdAt,
//         postUpdatedAt: posts.updatedAt,
//         userId: users.id,
//         userName: users.name,
//         userUsername: users.username,
//         userAvatar: users.avatar,
//         userVerified: users.verified,
//       })
//       .from(posts)
//       .leftJoin(users, eq(posts.authorId, users.id))
//       .where(where as any)
//       .orderBy(desc(posts.createdAt), desc(posts.id))
//       .limit(limit + 1);

//     const hasMore = rows.length > limit;
//     const items = hasMore ? rows.slice(0, limit) : rows;
//     const nextCursor = hasMore ? items[items.length - 1].postCreatedAt.toISOString() : undefined;

//     return {
//       items: items.map(row => ({
//         id: row.postId,
//         content: row.postContent,
//         mediaUrl: row.postMediaUrl,
//         visibility: row.postVisibility,
//         likeCount: row.postLikeCount,
//         commentCount: row.postCommentCount,
//         isDeleted: row.postIsDeleted,
//         createdAt: row.postCreatedAt,
//         updatedAt: row.postUpdatedAt,
//         user: {
//           id: row.userId,
//           name: row.userName,
//           username: row.userUsername,
//           avatar: row.userAvatar,
//           verified: row.userVerified,
//         },
//       })),
//       nextCursor,
//       hasMore,
//     };
//   }



// }

// export const postRepository = new PostRepository()
import { and, or, eq, lt, desc } from 'drizzle-orm';
import { db } from '../database';
import { posts, postLikes } from '../database/schema';

function encodeCursor(createdAt: Date, id: string) {
  return `${createdAt.toISOString()}_${id}`;
}
function decodeCursor(cursor?: string): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  const i = cursor.lastIndexOf('_');
  if (i <= 0) return null;
  const ts = cursor.slice(0, i);
  const id = cursor.slice(i + 1);
  const createdAt = new Date(ts);
  if (Number.isNaN(createdAt.getTime()) || !id) return null;
  return { createdAt, id };
}

export class PostRepository {
  async listAll(limit: number, cursor?: string) {
    const parsed = decodeCursor(cursor);

    let qb = db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        content: posts.content,
        mediaUrl: posts.mediaUrl,
        visibility: posts.visibility,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        isDeleted: posts.isDeleted,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .$dynamic();

    if (parsed) {
      qb = qb.where(
        or(
          lt(posts.createdAt, parsed.createdAt),
          and(eq(posts.createdAt, parsed.createdAt), lt(posts.id, parsed.id)),
        ),
      );
    }

    const rows = await qb.orderBy(desc(posts.createdAt), desc(posts.id)).limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const tail = items[items.length - 1];
    const nextCursor = hasMore && tail ? encodeCursor(tail.createdAt as Date, tail.id as string) : undefined;

    return { items, nextCursor, hasMore };
  }

  async listByAuthor(authorId: string, limit: number, cursor?: string) {
    const parsed = decodeCursor(cursor);

    let qb = db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        content: posts.content,
        mediaUrl: posts.mediaUrl,
        visibility: posts.visibility,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        isDeleted: posts.isDeleted,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.authorId, authorId))
      .$dynamic();

    if (parsed) {
      qb = qb.where(
        or(
          lt(posts.createdAt, parsed.createdAt),
          and(eq(posts.createdAt, parsed.createdAt), lt(posts.id, parsed.id)),
        ),
      );
    }

    const rows = await qb.orderBy(desc(posts.createdAt), desc(posts.id)).limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const tail = items[items.length - 1];
    const nextCursor = hasMore && tail ? encodeCursor(tail.createdAt as Date, tail.id as string) : undefined;

    return { items, nextCursor, hasMore };
  }
}

export const postRepository = new PostRepository()

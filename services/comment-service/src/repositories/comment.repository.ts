// import { eq, and, desc, sql, lt } from 'drizzle-orm';
// import { db } from '../database';
// import { comments, commentLikes } from '../database/schema';

// import { TOPICS, CommentCreatedEvent, CommentDeletedEvent, CommentLikedEvent, CommentUnlikedEvent, PostCommentCountChangedEvent } from "../events/types"
// import { kafkaService } from '../events/kafka.service';

// function encodeCursor(createdAt: Date, id: string): string {
//   return `${createdAt.toISOString()}_${id}`;
// }

// function decodeCursor(cursor?: string): { createdAt: Date; id: string } | null {
//   if (!cursor) return null;
//   const i = cursor.lastIndexOf('_');
//   if (i <= 0) return null;
//   const ts = cursor.slice(0, i);
//   const id = cursor.slice(i + 1);
//   const createdAt = new Date(ts);
//   if (Number.isNaN(createdAt.getTime()) || !id) return null;
//   return { createdAt, id };
// }

// export class CommentRepository {
//   async create(
//     userId: string,
//     data: { postId: string; content: string; parentId?: string }
//   ) {
//     // Insert comment
//     const [comment] = await db.insert(comments)
//       .values({
//         postId: data.postId,
//         userId,
//         content: data.content,
//         parentCommentId: data.parentId,
//       })
//       .returning();

//     // Publish comment created event
//     const commentEvent: CommentCreatedEvent = {
//       eventType: 'comment.created',
//       commentId: comment.id,
//       postId: data.postId,
//       userId,
//       content: data.content,
//       parentCommentId: data.parentId,
//       timestamp: new Date().toISOString(),
//     };
//     await kafkaService.publishEvent(TOPICS.COMMENT_CREATED, commentEvent);

//     // Publish post count change event (post-service will consume this)
//     const countEvent: PostCommentCountChangedEvent = {
//       eventType: 'post.comment_count.changed',
//       postId: data.postId,
//       delta: 1,
//       timestamp: new Date().toISOString(),
//     };
//     await kafkaService.publishEvent(TOPICS.POST_COMMENT_COUNT_CHANGED, countEvent);

//     return comment;
//   }

//   async getById(id: string) {
//     const [comment] = await db.select()
//       .from(comments)
//       .where(eq(comments.id, id))
//       .limit(1);
//     return comment ?? null;
//   }

//   async listByPost(postId: string, limit: number = 20, cursor?: string) {
//     const cur = decodeCursor(cursor);

//     let query = db.select()
//       .from(comments)
//       .where(and(
//         eq(comments.postId, postId),
//         eq(comments.isDeleted, false),
//         cur ? lt(comments.createdAt, cur.createdAt) : undefined
//       ))
//       .orderBy(desc(comments.createdAt))
//       .limit(limit + 1);

//     const items = await query;
//     const hasMore = items.length > limit;
//     const results = hasMore ? items.slice(0, limit) : items;
//     const nextCursor = hasMore && results.length > 0
//       ? encodeCursor(results[results.length - 1].createdAt, results[results.length - 1].id)
//       : undefined;

//     return { items: results, nextCursor, hasMore };
//   }

//   async listReplies(parentCommentId: string, limit: number = 20, cursor?: string) {
//     const cur = decodeCursor(cursor);

//     let query = db.select()
//       .from(comments)
//       .where(and(
//         eq(comments.parentCommentId, parentCommentId),
//         eq(comments.isDeleted, false),
//         cur ? lt(comments.createdAt, cur.createdAt) : undefined
//       ))
//       .orderBy(desc(comments.createdAt))
//       .limit(limit + 1);

//     const items = await query;
//     const hasMore = items.length > limit;
//     const results = hasMore ? items.slice(0, limit) : items;
//     const nextCursor = hasMore && results.length > 0
//       ? encodeCursor(results[results.length - 1].createdAt, results[results.length - 1].id)
//       : undefined;

//     return { items: results, nextCursor, hasMore };
//   }

//   async delete(id: string, userId: string) {
//     const comment = await this.getById(id);
//     if (!comment) throw new Error('Comment not found');
//     if (comment.userId !== userId) throw new Error('Unauthorized');

//     // Soft delete
//     const [deleted] = await db.update(comments)
//       .set({ isDeleted: true })
//       .where(eq(comments.id, id))
//       .returning();

//     if (deleted) {
//       // Publish delete event
//       const deleteEvent: CommentDeletedEvent = {
//         eventType: 'comment.deleted',
//         commentId: id,
//         postId: comment.postId,
//         userId,
//         timestamp: new Date().toISOString(),
//       };
//       await kafkaService.publishEvent(TOPICS.COMMENT_DELETED, deleteEvent);

//       // Decrement post comment count
//       const countEvent: PostCommentCountChangedEvent = {
//         eventType: 'post.comment_count.changed',
//         postId: comment.postId,
//         delta: -1,
//         timestamp: new Date().toISOString(),
//       };
//       await kafkaService.publishEvent(TOPICS.POST_COMMENT_COUNT_CHANGED, countEvent);
//     }

//     return deleted ?? null;
//   }

//   async like(commentId: string, userId: string) {
//     try {
//       const comment = await this.getById(commentId);
//       if (!comment) throw new Error('Comment not found');

//       // Insert like
//       await db.insert(commentLikes).values({ commentId, userId });

//       // Increment like count
//       await db.update(comments)
//         .set({ likeCount: sql`${comments.likeCount} + 1` })
//         .where(eq(comments.id, commentId));

//       // Publish event
//       const event: CommentLikedEvent = {
//         eventType: 'comment.liked',
//         commentId,
//         postId: comment.postId,
//         userId,
//         timestamp: new Date().toISOString(),
//       };
//       await kafkaService.publishEvent(TOPICS.COMMENT_LIKED, event);

//       return { success: true, alreadyLiked: false };
//     } catch (error: any) {
//       if (error.code === '23505') { // Unique constraint violation
//         return { success: true, alreadyLiked: true };
//       }
//       throw error;
//     }
//   }

//   async unlike(commentId: string, userId: string) {
//     const comment = await this.getById(commentId);
//     if (!comment) throw new Error('Comment not found');

//     // Delete the like
//     const result = await db.delete(commentLikes)
//       .where(and(
//         eq(commentLikes.commentId, commentId),
//         eq(commentLikes.userId, userId)
//       ))
//       .returning();

//     // Only decrement and publish if like existed
//     if (result.length > 0) {
//       await db.update(comments)
//         .set({ likeCount: sql`GREATEST(${comments.likeCount} - 1, 0)` })
//         .where(eq(comments.id, commentId));

//       // Publish event
//       const event: CommentUnlikedEvent = {
//         eventType: 'comment.unliked',
//         commentId,
//         postId: comment.postId,
//         userId,
//         timestamp: new Date().toISOString(),
//       };
//       await kafkaService.publishEvent(TOPICS.COMMENT_UNLIKED, event);
//     }

//     return { success: true, wasLiked: result.length > 0 };
//   }
// }

// export const commentRepository = new CommentRepository();
import { eq, and, desc, sql, lt } from 'drizzle-orm';
import { db } from '../database';
import { comments, commentLikes } from '../database/schema';

import { TOPICS, CommentCreatedEvent, CommentDeletedEvent, CommentLikedEvent, CommentUnlikedEvent, PostCommentCountChangedEvent } from "../events/types"
import { kafkaService } from '../events/kafka.service';

function encodeCursor(createdAt: Date, id: string): string {
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

// ✅ Add user enrichment helper
async function enrichCommentsWithUserData(comments: any[]) {
  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';

  return Promise.all(
    comments.map(async (comment) => {
      try {
        const response = await fetch(`${userServiceUrl}/api/v1/users/${comment.userId}`);

        if (response.ok) {
          const userData = await response.json();
          return {
            ...comment,
            author: userData.data || null,
          };
        }
      } catch (error) {
        console.error(`Failed to fetch user ${comment.userId}:`, error);
      }

      // Return comment without author if fetch fails
      return {
        ...comment,
        author: null,
      };
    })
  );
}

export class CommentRepository {
  async create(
    userId: string,
    data: { postId: string; content: string; parentId?: string }
  ) {
    // Insert comment
    const [comment] = await db.insert(comments)
      .values({
        postId: data.postId,
        userId,
        content: data.content,
        parentCommentId: data.parentId,
      })
      .returning();

    // Publish comment created event
    const commentEvent: CommentCreatedEvent = {
      eventType: 'comment.created',
      commentId: comment.id,
      postId: data.postId,
      userId,
      content: data.content,
      parentCommentId: data.parentId,
      timestamp: new Date().toISOString(),
    };
    await kafkaService.publishEvent(TOPICS.COMMENT_CREATED, commentEvent);

    // Publish post count change event (post-service will consume this)
    const countEvent: PostCommentCountChangedEvent = {
      eventType: 'post.comment_count.changed',
      postId: data.postId,
      delta: 1,
      timestamp: new Date().toISOString(),
    };
    await kafkaService.publishEvent(TOPICS.POST_COMMENT_COUNT_CHANGED, countEvent);

    // ✅ Enrich with user data before returning
    const enriched = await enrichCommentsWithUserData([comment]);
    return enriched[0];
  }

  async getById(id: string) {
    const [comment] = await db.select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);
    return comment ?? null;
  }

  // ✅ Updated to enrich with user data
  async listByPost(postId: string, limit: number = 20, cursor?: string) {
    const cur = decodeCursor(cursor);

    let query = db.select()
      .from(comments)
      .where(and(
        eq(comments.postId, postId),
        eq(comments.isDeleted, false),
        cur ? lt(comments.createdAt, cur.createdAt) : undefined
      ))
      .orderBy(desc(comments.createdAt))
      .limit(limit + 1);

    const items = await query;
    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;

    // ✅ Enrich with user data
    const enrichedResults = await enrichCommentsWithUserData(results);

    const nextCursor = hasMore && enrichedResults.length > 0
      ? encodeCursor(enrichedResults[enrichedResults.length - 1].createdAt, enrichedResults[enrichedResults.length - 1].id)
      : undefined;

    return { items: enrichedResults, nextCursor, hasMore };
  }

  // ✅ Updated to enrich with user data
  async listReplies(parentCommentId: string, limit: number = 20, cursor?: string) {
    const cur = decodeCursor(cursor);

    let query = db.select()
      .from(comments)
      .where(and(
        eq(comments.parentCommentId, parentCommentId),
        eq(comments.isDeleted, false),
        cur ? lt(comments.createdAt, cur.createdAt) : undefined
      ))
      .orderBy(desc(comments.createdAt))
      .limit(limit + 1);

    const items = await query;
    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;

    // ✅ Enrich with user data
    const enrichedResults = await enrichCommentsWithUserData(results);

    const nextCursor = hasMore && enrichedResults.length > 0
      ? encodeCursor(enrichedResults[enrichedResults.length - 1].createdAt, enrichedResults[enrichedResults.length - 1].id)
      : undefined;

    return { items: enrichedResults, nextCursor, hasMore };
  }

  async delete(id: string, userId: string) {
    const comment = await this.getById(id);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId) throw new Error('Unauthorized');

    // Soft delete
    const [deleted] = await db.update(comments)
      .set({ isDeleted: true })
      .where(eq(comments.id, id))
      .returning();

    if (deleted) {
      // Publish delete event
      const deleteEvent: CommentDeletedEvent = {
        eventType: 'comment.deleted',
        commentId: id,
        postId: comment.postId,
        userId,
        timestamp: new Date().toISOString(),
      };
      await kafkaService.publishEvent(TOPICS.COMMENT_DELETED, deleteEvent);

      // Decrement post comment count
      const countEvent: PostCommentCountChangedEvent = {
        eventType: 'post.comment_count.changed',
        postId: comment.postId,
        delta: -1,
        timestamp: new Date().toISOString(),
      };
      await kafkaService.publishEvent(TOPICS.POST_COMMENT_COUNT_CHANGED, countEvent);
    }

    return deleted ?? null;
  }

  async like(commentId: string, userId: string) {
    try {
      const comment = await this.getById(commentId);
      if (!comment) throw new Error('Comment not found');

      // Insert like
      await db.insert(commentLikes).values({ commentId, userId });

      // Increment like count
      await db.update(comments)
        .set({ likeCount: sql`${comments.likeCount} + 1` })
        .where(eq(comments.id, commentId));

      // Publish event
      const event: CommentLikedEvent = {
        eventType: 'comment.liked',
        commentId,
        postId: comment.postId,
        userId,
        timestamp: new Date().toISOString(),
      };
      await kafkaService.publishEvent(TOPICS.COMMENT_LIKED, event);

      return { success: true, alreadyLiked: false };
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: true, alreadyLiked: true };
      }
      throw error;
    }
  }

  async unlike(commentId: string, userId: string) {
    const comment = await this.getById(commentId);
    if (!comment) throw new Error('Comment not found');

    // Delete the like
    const result = await db.delete(commentLikes)
      .where(and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.userId, userId)
      ))
      .returning();

    // Only decrement and publish if like existed
    if (result.length > 0) {
      await db.update(comments)
        .set({ likeCount: sql`GREATEST(${comments.likeCount} - 1, 0)` })
        .where(eq(comments.id, commentId));

      // Publish event
      const event: CommentUnlikedEvent = {
        eventType: 'comment.unliked',
        commentId,
        postId: comment.postId,
        userId,
        timestamp: new Date().toISOString(),
      };
      await kafkaService.publishEvent(TOPICS.COMMENT_UNLIKED, event);
    }

    return { success: true, wasLiked: result.length > 0 };
  }
}

export const commentRepository = new CommentRepository();

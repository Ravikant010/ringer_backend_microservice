// // src/repositories/post.repository.ts
// import { and, or, eq, lt, desc, sql } from 'drizzle-orm';
// import { db } from '../database';
// import { posts, postLikes } from '../database/schema';

// /**
//  * Encodes cursor from timestamp and ID for stable pagination
//  */
// function encodeCursor(createdAt: Date, id: string): string {
//   return `${createdAt.toISOString()}_${id}`;
// }

// /**
//  * Decodes cursor back to timestamp and ID
//  */
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

// /**
//  * Repository for post-related database operations
//  */
// export class PostRepository {
//   /**
//    * Create a new post
//    */
//   async create(
//     authorId: string,
//     data: {
//       content: string;
//       mediaUrl?: string;
//       visibility?: 'public' | 'followers' | 'private'
//     }
//   ) {
//     const [row] = await db.insert(posts).values({
//       authorId,
//       content: data.content,
//       mediaUrl: data.mediaUrl,
//       visibility: (data.visibility ?? 'public') as any,
//     }).returning();

//     return row;
//   }

//   /**
//    * Get a single post by ID
//    */
//   async getById(id: string) {
//     const rows = await db.select()
//       .from(posts)
//       .where(eq(posts.id, id))
//       .limit(1);

//     return rows[0] ?? null;
//   }

//   /**
//    * Update post content
//    */
//   async update(id: string, authorId: string, data: { content: string }) {
//     const [updated] = await db.update(posts)
//       .set({
//         content: data.content,
//         updatedAt: new Date()
//       })
//       .where(and(
//         eq(posts.id, id),
//         eq(posts.authorId, authorId)
//       ))
//       .returning();

//     return updated ?? null;
//   }

//   /**
//    * Soft delete a post
//    */
//   async delete(id: string, authorId: string) {
//     const [deleted] = await db.update(posts)
//       .set({ isDeleted: true })
//       .where(and(
//         eq(posts.id, id),
//         eq(posts.authorId, authorId)
//       ))
//       .returning();

//     return deleted ?? null;
//   }

//   /**
//    * List all posts with cursor-based pagination
//    * Ordered by createdAt DESC, id DESC for stable sorting
//    */
//   async listAll(limit: number, cursor?: string) {
//     const parsed = decodeCursor(cursor);

//     let qb = db
//       .select({
//         id: posts.id,
//         authorId: posts.authorId,
//         content: posts.content,
//         mediaUrl: posts.mediaUrl,
//         visibility: posts.visibility,
//         likeCount: posts.likeCount,
//         commentCount: posts.commentCount,
//         isDeleted: posts.isDeleted,
//         createdAt: posts.createdAt,
//         updatedAt: posts.updatedAt,
//       })
//       .from(posts)
//       .$dynamic();

//     // Apply cursor pagination if cursor exists
//     if (parsed) {
//       qb = qb.where(
//         or(
//           lt(posts.createdAt, parsed.createdAt),
//           and(
//             eq(posts.createdAt, parsed.createdAt),
//             lt(posts.id, parsed.id)
//           )
//         )
//       );
//     }

//     // Fetch limit + 1 to check if there are more results
//     const rows = await qb
//       .orderBy(desc(posts.createdAt), desc(posts.id))
//       .limit(limit + 1);

//     // Calculate pagination metadata
//     const hasMore = rows.length > limit;
//     const items = hasMore ? rows.slice(0, limit) : rows;
//     const tail = items[items.length - 1];
//     const nextCursor = hasMore && tail
//       ? encodeCursor(tail.createdAt as Date, tail.id as string)
//       : undefined;

//     return { items, nextCursor, hasMore };
//   }

//   /**
//    * List posts by a specific author with cursor-based pagination
//    */
//   async listByAuthor(authorId: string, limit: number, cursor?: string) {
//     const parsed = decodeCursor(cursor);

//     let qb = db
//       .select({
//         id: posts.id,
//         authorId: posts.authorId,
//         content: posts.content,
//         mediaUrl: posts.mediaUrl,
//         visibility: posts.visibility,
//         likeCount: posts.likeCount,
//         commentCount: posts.commentCount,
//         isDeleted: posts.isDeleted,
//         createdAt: posts.createdAt,
//         updatedAt: posts.updatedAt,
//       })
//       .from(posts)
//       .$dynamic();

//     // Build conditions array to combine properly with AND
//     const conditions = [eq(posts.authorId, authorId)];

//     if (parsed) {
//       conditions.push(
//         or(
//           lt(posts.createdAt, parsed.createdAt),
//           and(
//             eq(posts.createdAt, parsed.createdAt),
//             lt(posts.id, parsed.id)
//           )
//         )!
//       );
//     }

//     // Apply all conditions at once with AND
//     qb = qb.where(and(...conditions));

//     const rows = await qb
//       .orderBy(desc(posts.createdAt), desc(posts.id))
//       .limit(limit + 1);

//     const hasMore = rows.length > limit;
//     const items = hasMore ? rows.slice(0, limit) : rows;
//     const tail = items[items.length - 1];
//     const nextCursor = hasMore && tail
//       ? encodeCursor(tail.createdAt as Date, tail.id as string)
//       : undefined;

//     return { items, nextCursor, hasMore };
//   }

//   /**
//    * Like a post (idempotent - returns success even if already liked)
//    */
//   async like(postId: string, userId: string) {
//     try {
//       // Insert like (will fail with unique constraint if already exists)
//       await db.insert(postLikes).values({ postId, userId });

//       // Increment like count
//       await db.update(posts)
//         .set({
//           likeCount: sql`${posts.likeCount} + 1`
//         })
//         .where(eq(posts.id, postId));

//       return { success: true, alreadyLiked: false };
//     } catch (error) {
//       // Unique constraint violation => user already liked this post
//       return { success: true, alreadyLiked: true };
//     }
//   }

//   /**
//    * Unlike a post
//    */
//   async unlike(postId: string, userId: string) {
//     // Delete the like and get result to check if it existed
//     const result = await db.delete(postLikes)
//       .where(and(
//         eq(postLikes.postId, postId),
//         eq(postLikes.userId, userId)
//       ))
//       .returning();

//     // Only decrement if like actually existed
//     if (result.length > 0) {
//       await db.update(posts)
//         .set({
//           likeCount: sql`GREATEST(${posts.likeCount} - 1, 0)`
//         })
//         .where(eq(posts.id, postId));
//     }

//     return { success: true, wasLiked: result.length > 0 };
//   }

//   /**
//    * Check if a user has liked a post
//    */
//   async hasLiked(postId: string, userId: string): Promise<boolean> {
//     const result = await db.select()
//       .from(postLikes)
//       .where(and(
//         eq(postLikes.postId, postId),
//         eq(postLikes.userId, userId)
//       ))
//       .limit(1);

//     return result.length > 0;
//   }

//   /**
//    * Get like count for a post
//    */
//   async getLikeCount(postId: string): Promise<number> {
//     const result = await db.select({ count: sql<number>`count(*)` })
//       .from(postLikes)
//       .where(eq(postLikes.postId, postId));

//     return result[0]?.count || 0;
//   }

//   /**
//    * Get users who liked a post (with pagination)
//    */
//   async getLikers(postId: string, limit: number = 20, offset: number = 0) {
//     const result = await db.select({
//       userId: postLikes.userId,
//       createdAt: postLikes.createdAt
//     })
//       .from(postLikes)
//       .where(eq(postLikes.postId, postId))
//       .orderBy(desc(postLikes.createdAt))
//       .limit(limit)
//       .offset(offset);

//     return result;
//   }

//   /**
//    * Increment comment count (called when comment is created)
//    */
//   async incrementCommentCount(postId: string) {
//     await db.update(posts)
//       .set({
//         commentCount: sql`${posts.commentCount} + 1`
//       })
//       .where(eq(posts.id, postId));
//   }

//   /**
//    * Decrement comment count (called when comment is deleted)
//    */
//   async decrementCommentCount(postId: string) {
//     await db.update(posts)
//       .set({
//         commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)`
//       })
//       .where(eq(posts.id, postId));
//   }

//   /**
//    * Get posts by multiple IDs (useful for bulk operations)
//    */
//   async getByIds(ids: string[]) {
//     if (ids.length === 0) return [];

//     const result = await db.select()
//       .from(posts)
//       .where(sql`${posts.id} = ANY(${ids})`);

//     return result;
//   }
// }

// export const postRepository = new PostRepository();
// services/post-service/src/repositories/post.repository.ts
import { Post, NewPost, PostLike, NewPostLike } from '../database/schema';
import { db } from '../database';
import { posts, postLikes } from '../database/schema';
import { and, eq, sql, desc, lt } from 'drizzle-orm';
import { kafkaService } from '../events/kafka.service';
import { PostLikedEvent, PostUnlikedEvent, TOPICS } from '../events/type';

// Helper functions for cursor-based pagination
function encodeCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}_${id}`;
}

function decodeCursor(cursor?: string): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  const lastUnderscore = cursor.lastIndexOf('_');
  if (lastUnderscore <= 0) return null;

  const timestamp = cursor.slice(0, lastUnderscore);
  const id = cursor.slice(lastUnderscore + 1);
  const createdAt = new Date(timestamp);

  if (Number.isNaN(createdAt.getTime()) || !id) return null;
  return { createdAt, id };
}
interface UserData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  bio: string | null;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
}

// ✅ Define user-service batch response type
interface UserBatchResponse {
  users: UserData[];
}

// ✅ Define enriched post type
interface EnrichedPost extends Post {
  author: {
    username: string;
    firstName?: string;
    lastName?: string;
    avatar: string | null;
    isVerified?: boolean;
  };
}

async function enrichPostsWithUserData(posts: Post[]): Promise<EnrichedPost[]> {
  if (posts.length === 0) return [];

  const authorIds = [...new Set(posts.map(p => p.authorId))];

  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${userServiceUrl}/api/v1/users/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: authorIds }),
    });

    if (!response.ok) {
      console.error('Failed to fetch user data:', response.status);
      return posts.map(post => ({
        ...post,
        author: {
          username: 'Unknown User',
          avatar: null
        }
      }));
    }

    const usersData: UserBatchResponse = await response.json() as UserBatchResponse;

    // Create a map of userId -> user data
    const usersMap = new Map<string, UserData>(
      (usersData.users || []).map((user) => [user.id, user])
    );

    // Enrich posts with user data
    return posts.map((post): EnrichedPost => {
      const userData = usersMap.get(post.authorId);

      return {
        ...post,
        author: userData ? {
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.avatar,
          isVerified: userData.isVerified,
        } : {
          username: 'Unknown User',
          avatar: null,
        }
      };
    });
  } catch (error: any) {
    console.error('Error fetching user data:', error.message);
    return posts.map(post => ({
      ...post,
      author: {
        username: 'Unknown User',
        avatar: null
      }
    }));
  }
}
class PostRepository {
  // Create returns a Post type
  async create(authorId: string, data: Partial<NewPost>): Promise<Post> {
    const [post] = await db.insert(posts).values({
      authorId,
      content: data.content!,
      // mediaUrl: data.mediaUrl || null,
      visibility: data.visibility || 'public',
    }).returning();

    return post;
  }

  // Get by ID returns Post or null
  async getById(id: string): Promise<Post | null> {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(
        eq(posts.id, id),
        eq(posts.isDeleted, false)
      ))
      .limit(1);

    return post ?? null;
  }

  // Get feed with cursor-based pagination


  // Update your getFeed method
  async getFeed(limit: number = 20, cursor?: string) {
    const cur = decodeCursor(cursor);

    let query = db
      .select()
      .from(posts)
      .where(and(
        eq(posts.visibility, 'public'),
        eq(posts.isDeleted, false),
        cur ? lt(posts.createdAt, cur.createdAt) : undefined
      ))
      .orderBy(desc(posts.createdAt))
      .limit(limit + 1);

    const items = await query;
    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;

    // Enrich with user data
    const enrichedResults = await enrichPostsWithUserData(results);
    console.log('Enriched Results:', enrichedResults);

    const nextCursor = hasMore && results.length > 0
      ? encodeCursor(results[results.length - 1].createdAt, results[results.length - 1].id)
      : undefined;

    return { items: enrichedResults, nextCursor, hasMore };
  }

  // Get posts by author with cursor-based pagination
  async getByAuthor(authorId: string, limit: number = 20, cursor?: string) {
    const cur = decodeCursor(cursor);

    let query = db
      .select()
      .from(posts)
      .where(and(
        eq(posts.authorId, authorId),
        eq(posts.isDeleted, false),
        cur ? lt(posts.createdAt, cur.createdAt) : undefined
      ))
      .orderBy(desc(posts.createdAt))
      .limit(limit + 1);

    const items = await query;
    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore && results.length > 0
      ? encodeCursor(results[results.length - 1].createdAt, results[results.length - 1].id)
      : undefined;

    return { items: results, nextCursor, hasMore };
  }

  // Update post
  async update(id: string, authorId: string, data: Partial<NewPost>): Promise<Post | null> {
    const [updated] = await db
      .update(posts)
      .set({
        content: data.content,
        // mediaUrl: data.mediaUrl,
        visibility: data.visibility,
        updatedAt: new Date(),
      })
      .where(and(
        eq(posts.id, id),
        eq(posts.authorId, authorId),
        eq(posts.isDeleted, false)
      ))
      .returning();

    return updated ?? null;
  }

  // Soft delete post
  async delete(id: string, authorId: string): Promise<boolean> {
    const result = await db
      .update(posts)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(and(
        eq(posts.id, id),
        eq(posts.authorId, authorId)
      ))
      .returning();

    return result.length > 0;
  }

  // Like a post
  async like(postId: string, userId: string) {
    try {
      // Get post author before insertion
      const post = await this.getById(postId);
      if (!post) throw new Error('Post not found');

      // Insert like
      await db.insert(postLikes).values({ postId, userId });

      // Increment like count
      await db.update(posts)
        .set({ likeCount: sql`${posts.likeCount} + 1` })
        .where(eq(posts.id, postId));

      // Publish Kafka event
      const event: PostLikedEvent = {
        eventType: 'post.liked',
        postId,
        userId,
        authorId: post.authorId,
        timestamp: new Date().toISOString(),
      };
      await kafkaService.publishEvent(TOPICS.POST_LIKED, event);

      return { success: true, alreadyLiked: false };
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: true, alreadyLiked: true };
      }
      throw error;
    }
  }

  // Unlike a post
  async unlike(postId: string, userId: string) {
    // Get post author before deletion
    const post = await this.getById(postId);
    if (!post) throw new Error('Post not found');

    // Delete the like
    const result = await db.delete(postLikes)
      .where(and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, userId)
      ))
      .returning();

    // Only decrement and publish event if like existed
    if (result.length > 0) {
      await db.update(posts)
        .set({ likeCount: sql`GREATEST(${posts.likeCount} - 1, 0)` })
        .where(eq(posts.id, postId));

      // Publish Kafka event
      const event: PostUnlikedEvent = {
        eventType: 'post.unliked',
        postId,
        userId,
        authorId: post.authorId,
        timestamp: new Date().toISOString(),
      };
      await kafkaService.publishEvent(TOPICS.POST_UNLIKED, event);
    }

    return { success: true, wasLiked: result.length > 0 };
  }

  // Check if user has liked a post
  async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, userId)
      ))
      .limit(1);

    return !!like;
  }

  // Get posts with user like status
  async getFeedWithLikeStatus(userId: string, limit: number = 20, cursor?: string) {
    const feedResult = await this.getFeed(limit, cursor);

    // Get user's likes for these posts
    const postIds = feedResult.items.map(p => p.id);
    const userLikes = await db
      .select()
      .from(postLikes)
      .where(and(
        eq(postLikes.userId, userId),
        sql`${postLikes.postId} = ANY(${postIds})`
      ));

    const likedPostIds = new Set(userLikes.map(like => like.postId));

    // Add isLiked flag to each post
    const postsWithLikes = feedResult.items.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));

    return {
      items: postsWithLikes,
      nextCursor: feedResult.nextCursor,
      hasMore: feedResult.hasMore,
    };
  }

  // Increment comment count (called by Kafka consumer)
  async incrementCommentCount(postId: string): Promise<void> {
    await db.update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, postId));
  }

  // Decrement comment count (called by Kafka consumer)
  async decrementCommentCount(postId: string): Promise<void> {
    await db.update(posts)
      .set({ commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)` })
      .where(eq(posts.id, postId));
  }

  // Update comment count by delta (called by Kafka consumer)
  async updateCommentCount(postId: string, delta: number): Promise<void> {
    await db.update(posts)
      .set({
        commentCount: sql`GREATEST(${posts.commentCount} + ${delta}, 0)`
      })
      .where(eq(posts.id, postId));
  }

  // Get post statistics
  async getStats(postId: string) {
    const post = await this.getById(postId);
    if (!post) return null;

    return {
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      // shareCount: post.shareCount,
      // bookmarkCount: post.bookmarkCount,
    };
  }
}

export const postRepository = new PostRepository();

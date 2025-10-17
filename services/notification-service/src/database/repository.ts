import { db } from './index';
import { notifications } from './schema';
import { and, desc, eq, lt } from 'drizzle-orm';

// ✅ Add user enrichment helper with proper error handling
async function enrichNotificationsWithUserData(notificationsList: any[]) {
  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';

  console.log(`[NOTIFICATION-SERVICE] Enriching ${notificationsList.length} notifications with user data`);

  const enriched = await Promise.all(
    notificationsList.map(async (notification) => {
      try {
        // Fetch actor (who performed the action)
        const actorUrl = `${userServiceUrl}/api/v1/users/${notification.actorId}`;
        console.log(`[NOTIFICATION-SERVICE] Fetching actor from: ${actorUrl}`);

        const actorRes = await fetch(actorUrl);

        let actorData = null;
        if (actorRes.ok) {
          const actorJson = await actorRes.json();

          // Handle different response formats
          if (actorJson?.success && actorJson?.data) {
            actorData = actorJson.data;
          } else if (actorJson?.data) {
            actorData = actorJson.data;
          } else {
            actorData = actorJson;
          }

          console.log(`[NOTIFICATION-SERVICE] Actor data for ${notification.actorId}:`, actorData ? 'Found' : 'Not found');
        } else {
          console.warn(`[NOTIFICATION-SERVICE] Failed to fetch actor ${notification.actorId}: ${actorRes.status}`);
        }

        // Return notification with actor (or null if not found)
        return {
          ...notification,
          actor: actorData,
        };
      } catch (error) {
        console.error(`[NOTIFICATION-SERVICE] Error fetching actor ${notification.actorId}:`, error);

        // Return notification with null actor on error
        return {
          ...notification,
          actor: null,
        };
      }
    })
  );

  return enriched;
}

export class NotificationRepository {
  async create(data: {
    userId: string;
    actorId: string;
    postId?: string;
    commentId?: string;
    type: 'comment_on_post' | 'reply_on_comment' | 'post_liked' | 'comment_liked' | 'new_follower';
    title: string;
    body: string;
  }) {
    const [row] = await db.insert(notifications).values(data).returning();
    return row;
  }

  async list(userId: string, limit: number, cursor?: string) {
    try {
      const where = cursor
        ? and(eq(notifications.userId, userId), lt(notifications.id, cursor))
        : eq(notifications.userId, userId);

      const rows = await db
        .select()
        .from(notifications)
        .where(where as any)
        .orderBy(desc(notifications.createdAt), desc(notifications.id))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? items[items.length - 1].id : undefined;

      // ✅ Enrich with user data
      const enrichedItems = await enrichNotificationsWithUserData(items);

      return {
        items: enrichedItems,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      console.error('[NOTIFICATION-SERVICE] Error in list():', error);
      throw error;
    }
  }

  async markAsRead(id: string, userId: string) {
    const [row] = await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return row;
  }

  async markAllAsRead(userId: string) {
    const result = await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .returning();
    return { count: result.length };
  }
}

export const notificationRepo = new NotificationRepository();

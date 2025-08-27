import { and, between, count, desc, eq, gte, lte, sql, sum } from 'drizzle-orm'
import { db } from '../database'
import { analyticsEvents, metricsAggregates, userActivitySummary } from '../database/schema'

export class AnalyticsRepository {
  // Event ingestion
  async recordEvent(params: {
    eventType: string; userId?: string; targetUserId?: string; entityId?: string; 
    entityType?: string; metadata?: object; ipAddress?: string; userAgent?: string;
  }) {
    const [event] = await db.insert(analyticsEvents).values({
      eventType: params.eventType as any,
      userId: params.userId,
      targetUserId: params.targetUserId,
      entityId: params.entityId,
      entityType: params.entityType,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    }).returning()
    
    // Update user activity summary if userId provided
    if (params.userId) {
      await this.updateUserActivitySummary(params.userId, new Date(), params.eventType)
    }
    
    return event
  }

  // Dashboard summary metrics
  async getDashboardMetrics(startDate: Date, endDate: Date) {
    const [totalUsers] = await db.select({ count: count() })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, 'user_registered'),
        between(analyticsEvents.createdAt, startDate, endDate)
      ))

    const [totalPosts] = await db.select({ count: count() })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, 'post_created'),
        between(analyticsEvents.createdAt, startDate, endDate)
      ))

    const [totalComments] = await db.select({ count: count() })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, 'comment_created'),
        between(analyticsEvents.createdAt, startDate, endDate)
      ))

    const [totalLikes] = await db.select({ count: count() })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, 'post_liked'),
        between(analyticsEvents.createdAt, startDate, endDate)
      ))

    const [totalMessages] = await db.select({ count: count() })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, 'message_sent'),
        between(analyticsEvents.createdAt, startDate, endDate)
      ))

    const [activeUsersResult] = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as active_users
      FROM user_activity_summary 
      WHERE date BETWEEN ${startDate.toISOString().split('T')[0]} 
        AND ${endDate.toISOString().split('T')[0]}
    `)

    return {
      newUsers: totalUsers.count || 0,
      postsCreated: totalPosts.count || 0,
      commentsCreated: totalComments.count || 0,
      likesGiven: totalLikes.count || 0,
      messagesSent: totalMessages.count || 0,
      activeUsers: Number(activeUsersResult.rows[0]?.active_users) || 0,
    }
  }

  // Time-series data for charts
  async getEventTimeSeries(eventType: string, startDate: Date, endDate: Date, groupBy: 'hour' | 'day' | 'week' = 'day') {
    const dateFormat = groupBy === 'hour' ? 'hour' : groupBy === 'week' ? 'week' : 'day'
    
    const results = await db.execute(sql`
      SELECT 
        DATE_TRUNC(${dateFormat}, created_at) as period,
        COUNT(*) as count
      FROM analytics_events 
      WHERE event_type = ${eventType}
        AND created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY DATE_TRUNC(${dateFormat}, created_at)
      ORDER BY period ASC
    `)
    
    return results.rows.map(row => ({
      period: row.period,
      count: Number(row.count)
    }))
  }

  // Top content by engagement
  async getTopContent(startDate: Date, endDate: Date, entityType: string = 'post', limit: number = 10) {
    const results = await db.execute(sql`
      SELECT 
        entity_id,
        COUNT(*) as engagement_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM analytics_events 
      WHERE entity_type = ${entityType}
        AND event_type IN ('post_liked', 'comment_created')
        AND created_at BETWEEN ${startDate} AND ${endDate}
        AND entity_id IS NOT NULL
      GROUP BY entity_id
      ORDER BY engagement_count DESC
      LIMIT ${limit}
    `)
    
    return results.rows.map(row => ({
      entityId: row.entity_id,
      engagementCount: Number(row.engagement_count),
      uniqueUsers: Number(row.unique_users)
    }))
  }

  // User activity aggregation
  private async updateUserActivitySummary(userId: string, date: Date, eventType: string) {
    const dateOnly = date.toISOString().split('T')[0]
    
    const existing = await db.select()
      .from(userActivitySummary)
      .where(and(
        eq(userActivitySummary.userId, userId), 
        eq(userActivitySummary.date, dateOnly as any)
      ))
      .limit(1)

    const increment = this.getActivityIncrement(eventType)
    
    if (existing[0]) {
      await db.update(userActivitySummary)
        .set({
          ...increment,
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(userActivitySummary.userId, userId),
          eq(userActivitySummary.date, dateOnly as any)
        ))
    } else {
      await db.insert(userActivitySummary).values({
        userId,
        date: dateOnly as any,
        ...increment,
        lastActiveAt: new Date(),
      })
    }
  }

  private getActivityIncrement(eventType: string) {
    switch (eventType) {
      case 'post_created': return { postsCreated: sql`posts_created + 1` }
      case 'comment_created': return { commentsCreated: sql`comments_created + 1` }
      case 'post_liked':
      case 'comment_liked': return { likesGiven: sql`likes_given + 1` }
      case 'message_sent': return { messageseSent: sql`messages_sent + 1` }
      case 'media_uploaded': return { mediaUploaded: sql`media_uploaded + 1` }
      case 'user_login': return { loginCount: sql`login_count + 1` }
      default: return {}
    }
  }

  // User retention analysis
  async getUserRetention(startDate: Date, endDate: Date) {
    const results = await db.execute(sql`
      WITH daily_active AS (
        SELECT date, COUNT(DISTINCT user_id) as dau
        FROM user_activity_summary
        WHERE date BETWEEN ${startDate.toISOString().split('T')[0]} 
          AND ${endDate.toISOString().split('T')[0]}
        GROUP BY date
        ORDER BY date
      )
      SELECT 
        date,
        dau,
        AVG(dau) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as dau_7day_avg
      FROM daily_active
    `)

    return results.rows.map(row => ({
      date: row.date,
      dailyActiveUsers: Number(row.dau),
      sevenDayAverage: Number(row.dau_7day_avg)
    }))
  }

  // Get user activity details
  async getUserActivity(startDate: Date, endDate: Date, userId?: string) {
    let query = db.select().from(userActivitySummary)
      .where(and(
        gte(userActivitySummary.date, startDate.toISOString().split('T')[0] as any),
        lte(userActivitySummary.date, endDate.toISOString().split('T')[0] as any)
      ))

    if (userId) {
      query = query.where(eq(userActivitySummary.userId, userId))
    }

    return await query.orderBy(desc(userActivitySummary.date))
  }
}

export const analyticsRepository = new AnalyticsRepository()

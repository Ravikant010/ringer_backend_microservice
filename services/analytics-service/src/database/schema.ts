import {
  pgTable, uuid, varchar, text, timestamp, integer, pgEnum, index, uniqueIndex, date,
} from 'drizzle-orm/pg-core'

export const eventTypeEnum = pgEnum('event_type', [
  'user_registered',
  'user_login', 
  'post_created',
  'comment_created',
  'post_liked',
  'comment_liked',
  'media_uploaded',
  'notification_sent',
  'message_sent',
  'user_followed'
])

export const aggregationPeriodEnum = pgEnum('aggregation_period', [
  'hourly', 'daily', 'weekly', 'monthly'
])

// Raw events for detailed tracking
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventType: eventTypeEnum('event_type').notNull(),
    userId: uuid('user_id'),                    // actor who performed the action
    targetUserId: uuid('target_user_id'),       // target of the action (for follows, etc.)
    entityId: uuid('entity_id'),               // postId, commentId, mediaId, etc.
    entityType: varchar('entity_type', { length: 50 }), // 'post', 'comment', 'media', 'user'
    metadata: text('metadata'),                // JSON string for additional context
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byTypeCreatedAt: index('idx_events_type_created_at').on(t.eventType, t.createdAt),
    byUserCreatedAt: index('idx_events_user_created_at').on(t.userId, t.createdAt),
    byEntityCreatedAt: index('idx_events_entity_created_at').on(t.entityType, t.entityId, t.createdAt),
    byCreatedAt: index('idx_events_created_at').on(t.createdAt),
  }),
)

// Pre-aggregated metrics for fast dashboard queries
export const metricsAggregates = pgTable(
  'metrics_aggregates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    metricName: varchar('metric_name', { length: 100 }).notNull(),
    period: aggregationPeriodEnum('period').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    value: integer('value').notNull(),
    dimensions: text('dimensions'), // JSON for grouping (e.g., by user segment)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueMetricPeriod: uniqueIndex('ux_metrics_name_period_start').on(t.metricName, t.period, t.periodStart),
    byMetricPeriod: index('idx_metrics_name_period').on(t.metricName, t.period, t.periodStart),
  }),
)

// Daily user activity summaries for retention analysis
export const userActivitySummary = pgTable(
  'user_activity_summary',
  {
    userId: uuid('user_id').notNull(),
    date: date('date').notNull(),
    postsCreated: integer('posts_created').notNull().default(0),
    commentsCreated: integer('comments_created').notNull().default(0),
    likesGiven: integer('likes_given').notNull().default(0),
    messageseSent: integer('messages_sent').notNull().default(0),
    mediaUploaded: integer('media_uploaded').notNull().default(0),
    loginCount: integer('login_count').notNull().default(0),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueUserDate: uniqueIndex('ux_user_activity_user_date').on(t.userId, t.date),
    byUserDate: index('idx_user_activity_user_date').on(t.userId, t.date),
    byDate: index('idx_user_activity_date').on(t.date),
  }),
)

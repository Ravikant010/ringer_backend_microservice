import { pgTable, uuid, text, timestamp, boolean, pgEnum, index } from 'drizzle-orm/pg-core'

export const notificationType = pgEnum('notification_type', [
  'comment_on_post',
  'reply_on_comment',
  'post_liked',
  'comment_liked',
  'new_follower',
])

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),     // recipient
    actorId: uuid('actor_id').notNull(),   // who did the action
    postId: uuid('post_id'),
    commentId: uuid('comment_id'),
    type: notificationType('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUserCreatedAt: index('idx_notifications_user_created_at').on(t.userId, t.createdAt),
    byUserReadCreatedAt: index('idx_notifications_user_read_created_at').on(t.userId, t.isRead, t.createdAt),
  }),
)

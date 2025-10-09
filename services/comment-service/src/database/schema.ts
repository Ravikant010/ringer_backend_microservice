import {
  pgTable, text, timestamp, uuid, integer, boolean,
  index, primaryKey, AnyPgColumn
} from 'drizzle-orm/pg-core'

// ===== COMMENTS TABLE =====
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id').notNull(),
    userId: uuid('user_id').notNull(),
    content: text('content').notNull(),
    parentCommentId: uuid('parent_comment_id').references((): AnyPgColumn => comments.id, {
      onDelete: 'cascade',
    }),
    likeCount: integer('like_count').notNull().default(0),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    byPostCreated: index('idx_comments_post_created').on(table.postId, table.createdAt),
    byUser: index('idx_comments_user').on(table.userId),
    byParent: index('idx_comments_parent').on(table.parentCommentId),
  })
)

// ===== COMMENT LIKES TABLE =====
export const commentLikes = pgTable(
  'comment_likes',
  {
    commentId: uuid('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.commentId, table.userId] }),
    byUser: index('idx_comment_likes_user').on(table.userId),
    byComment: index('idx_comment_likes_comment').on(table.commentId),
  })
)

// ===== TYPE EXPORTS =====

// Comment types
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert

// Comment Like types
export type CommentLike = typeof commentLikes.$inferSelect
export type NewCommentLike = typeof commentLikes.$inferInsert

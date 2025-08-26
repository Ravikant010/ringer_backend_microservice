
import {
  pgTable, uuid, text, timestamp, integer, boolean, index, uniqueIndex,
} from 'drizzle-orm/pg-core'  // [web:520]

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id').notNull(),          // remote FK to post-service domain [web:482]
    authorId: uuid('author_id').notNull(),      // remote FK to user-service domain [web:482]
    parentId: uuid('parent_id'),                // self-reference for replies [web:520]
    content: text('content').notNull(),
    likeCount: integer('like_count').notNull().default(0),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byPostCreatedAt: index('idx_comments_post_created_at').on(t.postId, t.createdAt),   // feed-friendly [web:520]
    byParentCreatedAt: index('idx_comments_parent_created_at').on(t.parentId, t.createdAt), // replies [web:520]
    byAuthorCreatedAt: index('idx_comments_author_created_at').on(t.authorId, t.createdAt), // auditing [web:520]
  }),
)

export const commentLikes = pgTable(
  'comment_likes',
  {
    commentId: uuid('comment_id').notNull(),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uxCommentUser: uniqueIndex('ux_comment_likes_comment_user').on(t.commentId, t.userId), // idempotent like [web:526]
  }),
)

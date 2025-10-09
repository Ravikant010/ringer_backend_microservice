import {
  pgTable, text, timestamp, uuid, integer, boolean,
  pgEnum, index, primaryKey
} from 'drizzle-orm/pg-core'

// ===== ENUMS =====
export const postVisibilityEnum = pgEnum('post_visibility', ['public', 'followers', 'private'])

// ===== POSTS TABLE =====
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: uuid('author_id').notNull(),
    content: text('content').notNull(),
    visibility: postVisibilityEnum('visibility').notNull().default('public'),
    likeCount: integer('like_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    byAuthorCreatedAt: index('idx_posts_author_created').on(table.authorId, table.createdAt),
    byCreatedAt: index('idx_posts_created').on(table.createdAt),
  })
)

// ===== POST LIKES TABLE =====
export const postLikes = pgTable(
  'post_likes',
  {
    postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.userId] }),
    byUser: index('idx_post_likes_user').on(table.userId),
    byPost: index('idx_post_likes_post').on(table.postId),
  })
)

// ===== TYPE EXPORTS =====

// Post types
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert

// Post Like types
export type PostLike = typeof postLikes.$inferSelect
export type NewPostLike = typeof postLikes.$inferInsert

// Visibility enum type
export type PostVisibility = 'public' | 'followers' | 'private'

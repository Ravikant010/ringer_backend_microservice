import {
  pgTable, varchar, text, timestamp, uuid, integer, boolean, pgEnum, index, uniqueIndex
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Enums
export const postVisibilityEnum = pgEnum('post_visibility', ['public', 'followers', 'private'])

// Tables
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: uuid('author_id').notNull(), // references user-service users.id (remote)
    content: text('content').notNull(),
    mediaUrl: varchar('media_url', { length: 2048 }), // optional attachment handled by media-service
    visibility: postVisibilityEnum('visibility').notNull().default('public'),
    likeCount: integer('like_count').notNull().default(0), // denormalized counter (updated async or on read)
    commentCount: integer('comment_count').notNull().default(0),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      byAuthorCreatedAt: index('idx_posts_author_created_at').on(table.authorId, table.createdAt),
      byCreatedAt: index('idx_posts_created_at').on(table.createdAt),
      byVisibility: index('idx_posts_visibility').on(table.visibility),
    }
  }
)

export const postLikes = pgTable(
  'post_likes',
  {
    postId: uuid('post_id').notNull(), // references posts.id
    userId: uuid('user_id').notNull(), // references users.id (remote)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: uniqueIndex('ux_post_likes_post_user').on(table.postId, table.userId),
    byUser: index('idx_post_likes_user').on(table.userId),
    byPost: index('idx_post_likes_post').on(table.postId),
  })
)

// Optional: bookmarks (for later)
export const postBookmarks = pgTable(
  'post_bookmarks',
  {
    postId: uuid('post_id').notNull(),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: uniqueIndex('ux_post_bookmarks_post_user').on(table.postId, table.userId),
    byUser: index('idx_post_bookmarks_user').on(table.userId),
    byPost: index('idx_post_bookmarks_post').on(table.postId),
  })
)

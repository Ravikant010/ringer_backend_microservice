import {
  pgTable, uuid, varchar, text, timestamp, boolean, index,
} from 'drizzle-orm/pg-core'

// Search index for users (denormalized for performance)
export const userSearchIndex = pgTable(
  'user_search_index',
  {
    userId: uuid('user_id').primaryKey(),
    username: varchar('username', { length: 50 }).notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    bio: text('bio'),
    searchVector: text('search_vector'), // tsvector for full-text search
    isActive: boolean('is_active').notNull().default(true),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    usernameIndex: index('idx_user_search_username').on(t.username),
    searchVectorIndex: index('idx_user_search_vector').using('gin', t.searchVector as any),
  }),
)

// Search index for posts (denormalized for performance)
export const postSearchIndex = pgTable(
  'post_search_index',
  {
    postId: uuid('post_id').primaryKey(),
    authorId: uuid('author_id').notNull(),
    content: text('content').notNull(),
    searchVector: text('search_vector'), // tsvector for full-text search
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    authorIndex: index('idx_post_search_author').on(t.authorId),
    createdAtIndex: index('idx_post_search_created_at').on(t.createdAt),
    searchVectorIndex: index('idx_post_search_vector').using('gin', t.searchVector as any),
  }),
)

import { relations } from 'drizzle-orm'
import { posts, postLikes, postBookmarks } from './schema'

export const postsRelations = relations(posts, ({ many }) => ({
  likes: many(postLikes),
  bookmarks: many(postBookmarks),
}))

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
}))

export const postBookmarksRelations = relations(postBookmarks, ({ one }) => ({
  post: one(posts, {
    fields: [postBookmarks.postId],
    references: [posts.id],
  }),
}))

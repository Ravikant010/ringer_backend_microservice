import { relations } from 'drizzle-orm'         // [web:522]
import { comments, commentLikes } from './schema'

export const commentsRelations = relations(comments, ({ many }) => ({
  likes: many(commentLikes),
}))

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
}))

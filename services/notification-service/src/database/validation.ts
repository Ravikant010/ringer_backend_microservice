import { z } from 'zod'

export const IngestCommentCreatedSchema = z.object({
  postId: z.string().uuid(),
  postAuthorId: z.string().uuid(),
  commentId: z.string().uuid(),
  commenterId: z.string().uuid(),
})

export const IngestReplyCreatedSchema = z.object({
  postId: z.string().uuid(),
  commentId: z.string().uuid(),            // parent
  parentCommentAuthorId: z.string().uuid(),
  replyId: z.string().uuid(),
  replierId: z.string().uuid(),
})

export const ListNotificationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
})

export const MarkReadSchema = z.object({
  id: z.string().uuid(),
})

import { z } from 'zod'

export const CreateCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(4000),
  parentId: z.string().uuid().optional(),
})

export const ListCommentsSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().optional(), // when present, list replies
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
})

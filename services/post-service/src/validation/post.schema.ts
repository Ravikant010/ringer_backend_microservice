// validation/post.schema.ts
import { z } from 'zod'

export const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrl: z.string().url().optional(),
  visibility: z.enum(['public', 'followers', 'private']).optional(),
})

export const UpdatePostSchema = z.object({
  content: z.string().min(1).max(5000),
})

export const ListPostsSchema = z.object({
  authorId: z.string().uuid(),
  limit: z.string().optional().transform(val => Number(val) || 20),
  cursor: z.string().optional(),
})

export const PaginationSchema = z.object({
  limit: z.string().optional().transform(val => Number(val) || 20),
  cursor: z.string().optional(),
})

// validation/comment.schema.ts
export const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentCommentId: z.string().uuid().optional(),
})

export const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
})

// validation/share.schema.ts
export const CreateShareSchema = z.object({
  caption: z.string().max(500).optional(),
})

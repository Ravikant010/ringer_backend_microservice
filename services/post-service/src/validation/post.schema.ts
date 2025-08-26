import { z } from 'zod'

export const CreatePostSchema = z.object({
  content: z.string().min(1).max(4000),
  mediaUrl: z.string().url().max(2048).optional(),
  visibility: z.enum(['public', 'followers', 'private']).optional(),
})

export const ListPostsSchema = z.object({
  authorId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(), // simple id-based cursor; can extend with createdAt later
})

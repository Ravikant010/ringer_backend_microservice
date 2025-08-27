import { z } from 'zod'

export const SendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(10000),
})

export const GetMessagesSchema = z.object({
  userId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
})

export const GetConversationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
})

export const MarkAsReadSchema = z.object({
  messageIds: z.array(z.string().uuid()).min(1).max(100),
})

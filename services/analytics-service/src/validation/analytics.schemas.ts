import { z } from 'zod'

export const IngestEventSchema = z.object({
  eventType: z.enum([
    'user_registered', 'user_login', 'post_created', 'comment_created', 
    'post_liked', 'comment_liked', 'media_uploaded', 'notification_sent',
    'message_sent', 'user_followed'
  ]),
  userId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  entityId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  metadata: z.object({}).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

export const DashboardQuerySchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
})

export const TimeSeriesQuerySchema = z.object({
  eventType: z.string(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  groupBy: z.enum(['hour', 'day', 'week']).default('day'),
})

export const UserActivityQuerySchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  userId: z.string().uuid().optional(),
})

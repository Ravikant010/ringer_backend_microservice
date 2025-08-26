import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'
import { notificationRepo } from '../database/repository'
import { IngestCommentCreatedSchema, IngestReplyCreatedSchema, ListNotificationsSchema } from '../database/validation'

export class NotificationController {
  async ingestCommentCreated(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId, postAuthorId, commentId, commenterId } = IngestCommentCreatedSchema.parse(req.body)
      if (postAuthorId === commenterId) return res.status(204).send()
      await notificationRepo.create({
        userId: postAuthorId,
        actorId: commenterId,
        postId,
        commentId,
        type: 'comment_on_post',
        title: 'New comment on your post',
        body: 'Someone commented on your post.',
      })
      res.status(201).json({ success: true })
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message, code: 'INGEST_COMMENT_FAILED' })
    }
  }

  async ingestReplyCreated(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId, commentId, parentCommentAuthorId, replyId, replierId } = IngestReplyCreatedSchema.parse(req.body)
      if (parentCommentAuthorId === replierId) return res.status(204).send()
      await notificationRepo.create({
        userId: parentCommentAuthorId,
        actorId: replierId,
        postId,
        commentId: replyId,
        type: 'reply_on_comment',
        title: 'New reply to your comment',
        body: 'Someone replied to your comment.',
      })
      res.status(201).json({ success: true })
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message, code: 'INGEST_REPLY_FAILED' })
    }
  }

  async listMyNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit, cursor } = ListNotificationsSchema.parse(req.query)
      const userId = req.user!.userId
      const page = await notificationRepo.list(userId, limit, cursor)
      res.json({ success: true, data: page.items, pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore } })
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message, code: 'LIST_NOTIFICATIONS_FAILED' })
    }
  }

  async markRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId
      const { id } = req.params
      const row = await notificationRepo.markRead(userId, id)
      if (!row) return res.status(404).json({ success: false, error: 'Not found', code: 'NOTIFICATION_NOT_FOUND' })
      res.json({ success: true })
    } catch {
      res.status(400).json({ success: false, error: 'Failed to mark read', code: 'MARK_READ_FAILED' })
    }
  }

  async markAllRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId
      await notificationRepo.markAllRead(userId)
      res.json({ success: true })
    } catch {
      res.status(400).json({ success: false, error: 'Failed to mark all read', code: 'MARK_ALL_READ_FAILED' })
    }
  }
}

export const notificationController = new NotificationController()

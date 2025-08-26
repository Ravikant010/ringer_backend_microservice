import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'
import { commentRepository } from '../repositories/comment.repository'
import { CreateCommentSchema, ListCommentsSchema } from '../validation/comment.schemas'

class CommentController {
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const authorId = req.user!.userId
      const body = CreateCommentSchema.parse(req.body)
      const comment = await commentRepository.create(authorId, body)
      res.status(201).json({ success: true, data: comment })
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Invalid payload', code: 'CREATE_COMMENT_FAILED' })
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const comment = await commentRepository.getById(id)
      if (!comment || comment.isDeleted) {
        return res.status(404).json({ success: false, error: 'Comment not found', code: 'COMMENT_NOT_FOUND' })
      }
      res.json({ success: true, data: comment })
    } catch {
      res.status(400).json({ success: false, error: 'Failed to fetch comment', code: 'GET_COMMENT_FAILED' })
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId, parentId, limit, cursor } = ListCommentsSchema.parse(req.query)
      if (parentId) {
        const page = await commentRepository.listReplies(parentId, limit, cursor)
        return res.json({ success: true, data: page.items, pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore } })
      }
      const page = await commentRepository.listByPost(postId, limit, cursor)
      res.json({ success: true, data: page.items, pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore } })
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Invalid query', code: 'LIST_COMMENTS_FAILED' })
    }
  }

  async like(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.user!.userId
      await commentRepository.like(id, userId)
      res.json({ success: true, message: 'Liked' })
    } catch {
      res.status(400).json({ success: false, error: 'Failed to like', code: 'LIKE_FAILED' })
    }
  }

  async unlike(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.user!.userId
      await commentRepository.unlike(id, userId)
      res.json({ success: true, message: 'Unliked' })
    } catch {
      res.status(400).json({ success: false, error: 'Failed to unlike', code: 'UNLIKE_FAILED' })
    }
  }
}
export const commentController = new CommentController()

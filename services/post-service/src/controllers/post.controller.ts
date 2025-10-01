import { Response } from 'express'
import { postRepository } from '../repositories/post.repository'
import { CreatePostSchema, ListPostsSchema } from '../validation/post.schema'
import { AuthenticatedRequest } from '../middleware/auth.middleware'
import { z } from 'zod';

export const ListFeedSchema = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
});
class PostController {
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { content, mediaUrl, visibility } = CreatePostSchema.parse(req.body)
      const authorId = req.user!.userId
      const post = await postRepository.create(authorId, { content, mediaUrl, visibility })
      res.status(201).json({ success: true, data: post })
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Invalid payload', code: 'CREATE_POST_FAILED' })
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const post = await postRepository.getById(id)
      if (!post || post.isDeleted!!) return res.status(404).json({ success: false, error: 'Post not found', code: 'POST_NOT_FOUND' })
      // TODO: enforce visibility rules (followers/private) once follow graph is ready
      res.json({ success: true, data: post })
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Failed to fetch post', code: 'GET_POST_FAILED' })
    }
  }

  async listByAuthor(req: AuthenticatedRequest, res: Response) {
    try {
      const { authorId, limit, cursor } = ListPostsSchema.parse(req.query)
      const page = await postRepository.listByAuthor(authorId, limit, cursor)
      res.json({ success: true, data: page.items, pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore } })
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message ?? 'Invalid query', code: 'LIST_POSTS_FAILED' })
    }
  }

  async like(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.user!.userId
      await postRepository.like(id, userId)
      res.json({ success: true, message: 'Liked' })
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Failed to like', code: 'LIKE_FAILED' })
    }
  }

  async unlike(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.user!.userId
      await postRepository.unlike(id, userId)
      res.json({ success: true, message: 'Unliked' })
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Failed to unlike', code: 'UNLIKE_FAILED' })
    }
  }
  async listAll(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('listAll called with query:', req.query);
      const { limit = '20', cursor } = ListFeedSchema.parse(req.query);
      const limitNum = Number(limit);
      const page = await postRepository.listAll(limitNum, cursor);

      res.json({
        success: true,
        data: page.items,
        pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore }
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.errors ?? err.message ?? 'Invalid query',
        code: 'LIST_ALL_POSTS_FAILED'
      });
    }
  }




}

export const postController = new PostController()

// import { Response } from 'express'
// import { postRepository } from '../repositories/post.repository'
// import { CreatePostSchema, ListPostsSchema } from '../validation/post.schema'
// import { AuthenticatedRequest } from '../middleware/auth.middleware'
// import { z } from 'zod';

// export const ListFeedSchema = z.object({
//   limit: z.string().optional(),
//   cursor: z.string().optional(),
// });
// class PostController {
//   async create(req: AuthenticatedRequest, res: Response) {
//     try {
//       const { content, mediaUrl, visibility } = CreatePostSchema.parse(req.body)
//       const authorId = req.user!.userId
//       const post = await postRepository.create(authorId, { content, mediaUrl, visibility })
//       res.status(201).json({ success: true, data: post })
//     } catch (err: any) {
//       res.status(400).json({ success: false, error: err.message ?? 'Invalid payload', code: 'CREATE_POST_FAILED' })
//     }
//   }

//   async getById(req: AuthenticatedRequest, res: Response) {
//     try {
//       const { id } = req.params
//       const post = await postRepository.getById(id)
//       if (!post || post.isDeleted!!) return res.status(404).json({ success: false, error: 'Post not found', code: 'POST_NOT_FOUND' })
//       // TODO: enforce visibility rules (followers/private) once follow graph is ready
//       res.json({ success: true, data: post })
//     } catch (err: any) {
//       res.status(400).json({ success: false, error: 'Failed to fetch post', code: 'GET_POST_FAILED' })
//     }
//   }

//   async listByAuthor(req: AuthenticatedRequest, res: Response) {
//     try {
//       const { authorId, limit, cursor } = ListPostsSchema.parse(req.query)
//       const page = await postRepository.listByAuthor(authorId, limit, cursor)
//       res.json({ success: true, data: page.items, pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore } })
//     } catch (err: any) {
//       res.status(400).json({ success: false, error: err.message ?? 'Invalid query', code: 'LIST_POSTS_FAILED' })
//     }
//   }

//   async like(req: AuthenticatedRequest, res: Response) {
//     try {
//       const { id } = req.params
//       const userId = req.user!.userId
//       await postRepository.like(id, userId)
//       res.json({ success: true, message: 'Liked' })
//     } catch (err: any) {
//       res.status(400).json({ success: false, error: 'Failed to like', code: 'LIKE_FAILED' })
//     }
//   }

//   async unlike(req: AuthenticatedRequest, res: Response) {
//     try {
//       const { id } = req.params
//       const userId = req.user!.userId
//       await postRepository.unlike(id, userId)
//       res.json({ success: true, message: 'Unliked' })
//     } catch (err: any) {
//       res.status(400).json({ success: false, error: 'Failed to unlike', code: 'UNLIKE_FAILED' })
//     }
//   }
//   async listAll(req: AuthenticatedRequest, res: Response) {
//     try {
//       console.log('listAll called with query:', req.query);
//       const { limit = '20', cursor } = ListFeedSchema.parse(req.query);
//       const limitNum = Number(limit);
//       const page = await postRepository.listAll(limitNum, cursor);

//       res.json({
//         success: true,
//         data: page.items,
//         pagination: { nextCursor: page.nextCursor, hasMore: page.hasMore }
//       });
//     } catch (err: any) {
//       res.status(400).json({
//         success: false,
//         error: err.errors ?? err.message ?? 'Invalid query',
//         code: 'LIST_ALL_POSTS_FAILED'
//       });
//     }
//   }




// }

// export const postController = new PostController()


// services/post-service/src/controllers/post.controller.ts
import { Response } from 'express';
import { Post, NewPost } from '../database/schema';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { postRepository } from '../repositories/post.repository';
import { CreatePostSchema, ListPostsSchema } from '../validation/post.schema';
import { z } from 'zod';

// Schema for feed/list with pagination
export const ListFeedSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  cursor: z.string().optional(),
});

class PostController {
  // Create a new post
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { content, visibility } = CreatePostSchema.parse(req.body);
      const authorId = req.user!.userId;

      const postData: Partial<NewPost> = {
        content,
        // mediaUrl,
        visibility: visibility || 'public',
      };

      const post: Post = await postRepository.create(authorId, postData);

      res.status(201).json({
        success: true,
        data: post
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: err.issues
        });
      }
      res.status(400).json({
        success: false,
        error: err.message ?? 'Failed to create post'
      });
    }
  }

  // Get post by ID
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = req.params.id;
      const post: Post | null = await postRepository.getById(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
          code: 'POST_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: post
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message ?? 'Failed to fetch post'
      });
    }
  }

  // Get feed (all public posts with pagination)
  async listAll(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit, cursor } = ListFeedSchema.parse(req.query);
      const userId = req.user?.userId;

      // If user is authenticated, include like status
      let result;
      if (userId) {
        result = await postRepository.getFeedWithLikeStatus(userId, limit, cursor);
      } else {
        result = await postRepository.getFeed(limit, cursor);
      }

      res.json({
        success: true,
        data: result.items,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: err.issues
        });
      }
      res.status(500).json({
        success: false,
        error: err.message ?? 'Failed to fetch feed'
      });
    }
  }

  // Get posts by author (with pagination)
  async listByAuthor(req: AuthenticatedRequest, res: Response) {
    try {
      const { authorId, limit, cursor } = ListPostsSchema.parse(req.query);

      if (!authorId) {
        return res.status(400).json({
          success: false,
          error: 'authorId query parameter is required',
          code: 'MISSING_AUTHOR_ID'
        });
      }

      const result = await postRepository.getByAuthor(
        authorId,
        limit,
        cursor
      );

      res.json({
        success: true,
        data: result.items,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: err.issues
        });
      }
      res.status(500).json({
        success: false,
        error: err.message ?? 'Failed to fetch posts'
      });
    }
  }

  // Like a post
  async like(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = req.params.id;
      const userId = req.user!.userId;

      const result = await postRepository.like(postId, userId);

      if (result.alreadyLiked) {
        return res.json({
          success: true,
          message: 'Already liked',
          alreadyLiked: true,
        });
      }

      res.json({
        success: true,
        message: 'Post liked successfully',
      });
    } catch (err: any) {
      if (err.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
          code: 'POST_NOT_FOUND'
        });
      }
      res.status(500).json({
        success: false,
        error: err.message ?? 'Failed to like post'
      });
    }
  }

  // Unlike a post
  async unlike(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = req.params.id;
      const userId = req.user!.userId;

      const result = await postRepository.unlike(postId, userId);

      if (!result.wasLiked) {
        return res.json({
          success: true,
          message: 'Post was not liked',
          wasLiked: false,
        });
      }

      res.json({
        success: true,
        message: 'Post unliked successfully',
      });
    } catch (err: any) {
      if (err.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
          code: 'POST_NOT_FOUND'
        });
      }
      res.status(500).json({
        success: false,
        error: err.message ?? 'Failed to unlike post'
      });
    }
  }

  // Update a post
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = req.params.id;
      const authorId = req.user!.userId;
      const { content, visibility } = req.body;

      const postData: Partial<NewPost> = {
        content,
        // mediaUrl,
        visibility,
      };

      const updatedPost = await postRepository.update(postId, authorId, postData);

      if (!updatedPost) {
        return res.status(404).json({
          success: false,
          error: 'Post not found or unauthorized',
          code: 'POST_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: updatedPost,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message ?? 'Failed to update post'
      });
    }
  }

  // Delete a post
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = req.params.id;
      const authorId = req.user!.userId;

      const deleted = await postRepository.delete(postId, authorId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Post not found or unauthorized',
          code: 'POST_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message ?? 'Failed to delete post'
      });
    }
  }

  // Get post statistics
  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = req.params.id;
      const stats = await postRepository.getStats(postId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
          code: 'POST_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message ?? 'Failed to fetch post stats'
      });
    }
  }
}

export const postController = new PostController();


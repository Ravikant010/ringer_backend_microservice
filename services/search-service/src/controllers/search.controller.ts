import { Request, Response } from 'express'
import { searchRepository } from '../repo/search.repository'
import { SearchUsersSchema, SearchPostsSchema } from '../validation/search.schema'

export class SearchController {
  async searchUsers(req: Request, res: Response) {
    try {
      const { q, limit, offset } = SearchUsersSchema.parse(req.query)
      
      // Sanitize query
      const sanitizedQuery = q.replace(/[^\w\s]/g, ' ').trim()
      if (!sanitizedQuery) {
        return res.status(400).json({ success: false, error: 'Invalid search query', code: 'INVALID_QUERY' })
      }

      const results = await searchRepository.searchUsers(sanitizedQuery, limit, offset)
      
      res.json({
        success: true,
        data: results,
        pagination: {
          limit,
          offset,
          count: results.length,
          hasMore: results.length === limit
        },
        query: sanitizedQuery
      })
    } catch (error: any) {
      console.error('User search error:', error)
      res.status(400).json({ success: false, error: error.message, code: 'SEARCH_USERS_FAILED' })
    }
  }

  async searchPosts(req: Request, res: Response) {
    try {
      const { q, authorId, limit, offset } = SearchPostsSchema.parse(req.query)
      
      // Sanitize query
      const sanitizedQuery = q.replace(/[^\w\s]/g, ' ').trim()
      if (!sanitizedQuery) {
        return res.status(400).json({ success: false, error: 'Invalid search query', code: 'INVALID_QUERY' })
      }

      const results = await searchRepository.searchPosts(sanitizedQuery, limit, offset, authorId)
      
      res.json({
        success: true,
        data: results,
        pagination: {
          limit,
          offset,
          count: results.length,
          hasMore: results.length === limit
        },
        query: sanitizedQuery,
        authorId
      })
    } catch (error: any) {
      console.error('Post search error:', error)
      res.status(400).json({ success: false, error: error.message, code: 'SEARCH_POSTS_FAILED' })
    }
  }

  // Webhook endpoints for data synchronization
  async syncUser(req: Request, res: Response) {
    try {
      const userData = req.body
      await searchRepository.syncUser(userData)
      res.status(200).json({ success: true, message: 'User synced successfully' })
    } catch (error: any) {
      console.error('User sync error:', error)
      res.status(500).json({ success: false, error: 'User sync failed', code: 'USER_SYNC_FAILED' })
    }
  }

  async syncPost(req: Request, res: Response) {
    try {
      const postData = req.body
      await searchRepository.syncPost(postData)
      res.status(200).json({ success: true, message: 'Post synced successfully' })
    } catch (error: any) {
      console.error('Post sync error:', error)
      res.status(500).json({ success: false, error: 'Post sync failed', code: 'POST_SYNC_FAILED' })
    }
  }
}

export const searchController = new SearchController()

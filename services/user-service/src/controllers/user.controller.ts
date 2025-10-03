import { Request, Response } from 'express'
import { userService } from '../services/user.service'
import { updateProfileSchema } from '../database/schema'
import { AuthenticatedRequest } from '../middleware/auth'
import { z } from 'zod'

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 50) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
})

export class UserController {
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params
      const requestingUserId = req.user?.userId

      const userProfile = await userService.getUserProfile(userId, requestingUserId)

      res.json({
        success: true,
        data: userProfile
      })
    } catch (error: any) {
      console.error('Get profile error:', error)
      res.status(404).json({
        success: false,
        error: error.message || 'User not found',
        code: 'USER_NOT_FOUND'
      })
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = updateProfileSchema.parse(req.body)

      const updatedUser = await userService.updateUserProfile(
        req.user.userId,
        validatedData
      )

      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      })
    } catch (error: any) {
      console.error('Update profile error:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update profile',
        code: 'PROFILE_UPDATE_FAILED'
      })
    }
  }

  async followUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params

      const result = await userService.followUser(req.user.userId, userId)

      res.json({
        success: true,
        message: result.message
      })
    } catch (error: any) {
      console.error('Follow user error:', error)

      const statusCode = error.message.includes('Cannot follow yourself') ||
        error.message.includes('Already following') ? 400 : 404

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to follow user',
        code: 'FOLLOW_FAILED'
      })
    }
  }

  async unfollowUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params

      const result = await userService.unfollowUser(req.user.userId, userId)

      res.json({
        success: true,
        message: result.message
      })
    } catch (error: any) {
      console.error('Unfollow user error:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to unfollow user',
        code: 'UNFOLLOW_FAILED'
      })
    }
  }

  async searchUsers(req: Request, res: Response) {
    try {
      const { q, limit, offset } = searchQuerySchema.parse(req.query)

      const users = await userService.searchUsers(q, limit, offset)

      res.json({
        success: true,
        data: users,
        pagination: {
          limit,
          offset,
          count: users.length,
          hasMore: users.length === limit
        }
      })
    } catch (error: any) {
      console.error('Search users error:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Search failed',
        code: 'SEARCH_FAILED'
      })
    }
  }

  async getFollowers(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params
      // Implementation would get followers list
      // For now, return placeholder
      res.json({
        success: true,
        data: [],
        message: 'Followers list (to be implemented)'
      })
    } catch (error: any) {
      console.error('Get followers error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get followers',
        code: 'GET_FOLLOWERS_FAILED'
      })
    }
  }

  async getFollowing(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params
      // Implementation would get following list
      // For now, return placeholder
      res.json({
        success: true,
        data: [],
        message: 'Following list (to be implemented)'
      })
    } catch (error: any) {
      console.error('Get following error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get following',
        code: 'GET_FOLLOWING_FAILED'
      })
    }
  }


}

export const userController = new UserController()

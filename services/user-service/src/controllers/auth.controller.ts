import { Request, Response } from 'express'
import { userService } from '../services/user.service'
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema 
} from '../database/schema'
import { AuthenticatedRequest } from '../middleware/auth'

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body)
      
      const result = await userService.registerUser(validatedData)

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/v1/auth'
      })

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken
        },
        message: 'Registration successful. Please check your email for verification.'
      })
    } catch (error: any) {
      console.error('Registration error:', error)
      
      const statusCode = error.message.includes('already exists') ? 409 : 400
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Registration failed',
        code: 'REGISTRATION_FAILED'
      })
    }
  }

  async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body)
      const ipAddress = req.ip || '127.0.0.1'
      const userAgent = req.get('user-agent') || 'Unknown'

      const result = await userService.loginUser(
        validatedData.email,
        validatedData.password,
        ipAddress,
        userAgent
      )

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/v1/auth'
      })

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken
        },
        message: 'Login successful'
      })
    } catch (error: any) {
      console.error('Login error:', error)
      
      const statusCode = error.message === 'Invalid credentials' ? 401 : 400
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Login failed',
        code: 'LOGIN_FAILED'
      })
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken

      if (refreshToken) {
        await userService.logoutUser(req.user.userId, refreshToken)
      }

      res.clearCookie('refreshToken', { path: '/api/v1/auth' })
      
      res.json({
        success: true,
        message: 'Logout successful'
      })
    } catch (error: any) {
      console.error('Logout error:', error)
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        code: 'LOGOUT_FAILED'
      })
    }
  }

  async refreshTokens(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token required',
          code: 'REFRESH_TOKEN_MISSING'
        })
      }

      const tokens = await userService.refreshTokens(refreshToken)

      // Set new refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth'
      })

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken
        },
        message: 'Tokens refreshed successfully'
      })
    } catch (error: any) {
      console.error('Token refresh error:', error)
      res.status(401).json({
        success: false,
        error: error.message || 'Token refresh failed',
        code: 'TOKEN_REFRESH_FAILED'
      })
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const userProfile = await userService.getUserProfile(req.user.userId)
      
      res.json({
        success: true,
        data: userProfile
      })
    } catch (error: any) {
      console.error('Get me error:', error)
      res.status(404).json({
        success: false,
        error: error.message || 'User not found',
        code: 'USER_NOT_FOUND'
      })
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = changePasswordSchema.parse(req.body)

      await userService.changePassword(
        req.user.userId,
        validatedData.currentPassword,
        validatedData.newPassword
      )

      // Clear refresh token cookie to force re-login
      res.clearCookie('refreshToken', { path: '/api/v1/auth' })

      res.json({
        success: true,
        message: 'Password changed successfully. Please log in again.'
      })
    } catch (error: any) {
      console.error('Change password error:', error)
      
      const statusCode = error.message === 'Current password is incorrect' ? 400 : 500
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to change password',
        code: 'PASSWORD_CHANGE_FAILED'
      })
    }
  }
}

export const authController = new AuthController()

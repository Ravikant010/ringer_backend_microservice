import { Request, Response, NextFunction } from 'express'
import { jwtService, TokenPayload } from '../utils/jwt'

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      })
    }

    const payload = jwtService.verifyAccessToken(token)
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    })
  }
}

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (token) {
      const payload = jwtService.verifyAccessToken(token)
      req.user = payload
    }
    next()
  } catch (error) {
    // Continue without authentication
    next()
  }
}

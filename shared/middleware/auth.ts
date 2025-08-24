import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'

export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
    role: string
  }
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.user = decoded

    next()
  } catch (error) {
    logger.error('Authentication error:', error)
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    })
  }
}

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      req.user = decoded
    }

    next()
  } catch (error) {
    // Continue without authentication
    next()
  }
}

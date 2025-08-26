import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email?: string; username?: string; isVerified?: boolean }
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Expect an upstream gateway/user-service to validate JWT and inject user (or validate here if needed)
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized', code: 'TOKEN_MISSING' })
  }
  // In a real setup, verify token using shared secret/public key or call user-service
  // Here, accept x-user-id for local dev convenience
  const userId = req.header('x-user-id')
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized', code: 'TOKEN_INVALID' })
  req.user = { userId }
  next()
}

import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email?: string; username?: string; isVerified?: boolean }
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized', code: 'TOKEN_MISSING' })
  }
  // Replace with real JWT verification (shared with user-service)
  const userId = req.header('x-user-id')
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized', code: 'TOKEN_INVALID' })
  req.user = { userId }
  next()
}

import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email?: string; username?: string }
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized', code: 'TOKEN_MISSING' })
  }
  
  const userId = req.header('x-user-id')
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized', code: 'TOKEN_INVALID' })
  
  req.user = { userId }
  next()
}

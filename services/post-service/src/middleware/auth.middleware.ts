// import { Request, Response, NextFunction } from 'express'

// export interface AuthenticatedRequest extends Request {
//   user?: { userId: string; email?: string; username?: string; isVerified?: boolean }
// }

// export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//   // Expect an upstream gateway/user-service to validate JWT and inject user (or validate here if needed)
//   const auth = req.headers.authorization
//   if (!auth?.startsWith('Bearer ')) {
//     return res.status(401).json({ success: false, error: 'Unauthorized', code: 'TOKEN_MISSING' })
//   }
//   // In a real setup, verify token using shared secret/public key or call user-service
//   // Here, accept x-user-id for local dev convenience
//   const userId = req.header('x-user-id')
//   if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized', code: 'TOKEN_INVALID' })
//   req.user = { userId }
//   next()
// }

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email?: string; username?: string; isVerified?: boolean }
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization
  console.log('Authorization header:', auth)

  console.log("===", auth?.startsWith('Bearer '))
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'TOKEN_MISSING'
    })
  }

  // Extract the token
  const token = auth.substring(7) // Remove 'Bearer ' prefix
  console.log("Token:", token)
  try {
    // Verify the JWT token (you need to use the same secret as user-service)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Set user info from the decoded token
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      isVerified: decoded.isVerified
    }

    next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'TOKEN_INVALID'
    })
  }
}

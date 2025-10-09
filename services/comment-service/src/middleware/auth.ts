import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email?: string; username?: string; isVerified?: boolean };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;

  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'TOKEN_MISSING'
    });
  }

  const token = auth.split(' ')[1];

  try {
    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET || Bun.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as any;

    req.user = {
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      username: decoded.username,
      isVerified: decoded.isVerified,
    };

    next();
  } catch (err: any) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'TOKEN_INVALID'
    });
  }
};

import jwt from 'jsonwebtoken'
import { User } from '../database/schema'

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets are not defined')
}

export interface TokenPayload {
  userId: string
  email: string
  username: string
  isVerified: boolean
}

export class JWTService {
  private readonly accessTokenSecret = process.env.JWT_SECRET!
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET!
  private readonly accessTokenExpiry = '15m'
  private readonly refreshTokenExpiry = '7d'

  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified!!
    }

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'social-platform',
      audience: 'social-platform-users'
    })
  }

  generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      type: 'refresh'
    }

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'social-platform',
      audience: 'social-platform-users'
    })
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret) as TokenPayload
    } catch (error) {
      throw new Error('Invalid access token')
    }
  }

  verifyRefreshToken(token: string): { userId: string; type: string } {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as { userId: string; type: string }
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }

  generateTokenPair(user: User) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user)
    }
  }
}

export const jwtService = new JWTService()

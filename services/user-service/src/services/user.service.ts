import { eq, and, or, ilike, desc, count, inArray, sql } from 'drizzle-orm'
import { db } from '../database'
import {
  users,
  userFollows,
  userSessions,
  emailVerificationTokens,
  passwordResetTokens,
  User
} from '../database/schema'
import { passwordService } from '../utils/password'
import { jwtService } from '../utils/jwt'

export class UserService {
  async registerUser(userData: {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
  }) {
    // Check if user exists
    const existingUser = await db.select().from(users)
      .where(or(
        eq(users.email, userData.email),
        eq(users.username, userData.username)
      ))
      .limit(1)

    if (existingUser.length > 0) {
      const field = existingUser[0].email === userData.email ? 'email' : 'username'
      throw new Error(`User with this ${field} already exists`)
    }

    // Hash password
    const passwordHash = await passwordService.hashPassword(userData.password)

    // Create user
    const [newUser] = await db.insert(users).values({
      username: userData.username,
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isActive: true,
      isVerified: false
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      avatar: users.avatar,
      isVerified: users.isVerified,
      createdAt: users.createdAt
    })

    // Generate email verification token
    const verificationToken = passwordService.generateRandomToken(32)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

    await db.insert(emailVerificationTokens).values({
      userId: newUser.id,
      token: verificationToken,
      expiresAt
    })

    // Generate JWT tokens
    const { accessToken, refreshToken } = jwtService.generateTokenPair(newUser as User)

    // Store refresh token
    await this.storeRefreshToken(newUser.id, refreshToken, '127.0.0.1', 'Unknown')

    return {
      user: newUser,
      tokens: { accessToken, refreshToken },
      verificationToken
    }
  }

  async loginUser(email: string, password: string, ipAddress: string, userAgent: string) {
    // Find user
    const [user] = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.isActive, true)))
      .limit(1)

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValidPassword = await passwordService.comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Update last seen and online status
    await db.update(users)
      .set({
        isOnline: true,
        lastSeen: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    // Generate JWT tokens
    const { accessToken, refreshToken } = jwtService.generateTokenPair(user)

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken, ipAddress, userAgent)

    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      bio: user.bio,
      isVerified: user.isVerified,
      isOnline: user.isOnline
    }

    return {
      user: userProfile,
      tokens: { accessToken, refreshToken }
    }
  }

  async logoutUser(userId: string, refreshToken: string) {
    // Remove specific refresh token
    await db.delete(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        eq(userSessions.refreshToken, refreshToken)
      ))

    // Update user offline status
    await db.update(users)
      .set({
        isOnline: false,
        lastSeen: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
  }

  async refreshTokens(refreshToken: string) {
    // Verify refresh token
    const payload = jwtService.verifyRefreshToken(refreshToken)

    // Check if token exists in database
    const [session] = await db.select().from(userSessions)
      .where(and(
        eq(userSessions.refreshToken, refreshToken),
        eq(userSessions.userId, payload.userId)
      ))
      .limit(1)

    if (!session || session.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token')
    }

    // Get user
    const [user] = await db.select().from(users)
      .where(eq(users.id, payload.userId))
      .limit(1)

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive')
    }

    // Generate new tokens
    const newTokens = jwtService.generateTokenPair(user)

    // Update refresh token in database
    await db.update(userSessions)
      .set({
        refreshToken: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })
      .where(eq(userSessions.id, session.id))

    return newTokens
  }

  async getUserProfile(userId: string, requestingUserId?: string) {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      avatar: users.avatar,
      bio: users.bio,
      location: users.location,
      website: users.website,
      isVerified: users.isVerified,
      isOnline: users.isOnline,
      lastSeen: users.lastSeen,
      createdAt: users.createdAt
    }).from(users)
      .where(and(eq(users.id, userId), eq(users.isActive, true)))
      .limit(1)

    if (!user) {
      throw new Error('User not found')
    }

    // Get follow counts
    const [followersCount] = await db.select({ count: count() })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId))

    const [followingCount] = await db.select({ count: count() })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId))

    // Check if requesting user follows this user
    let isFollowing = false
    if (requestingUserId && requestingUserId !== userId) {
      const [followRelation] = await db.select()
        .from(userFollows)
        .where(and(
          eq(userFollows.followerId, requestingUserId),
          eq(userFollows.followingId, userId)
        ))
        .limit(1)

      isFollowing = !!followRelation
    }

    return {
      ...user,
      followersCount: followersCount.count,
      followingCount: followingCount.count,
      isFollowing
    }
  }

  async updateUserProfile(userId: string, updates: {
    firstName?: string
    lastName?: string
    bio?: string
    location?: string
    website?: string
    dateOfBirth?: string
  }) {
    const updateData: any = {
      ...updates,
      updatedAt: new Date()
    }

    if (updates.dateOfBirth) {
      updateData.dateOfBirth = new Date(updates.dateOfBirth)
    }

    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        bio: users.bio,
        location: users.location,
        website: users.website,
        avatar: users.avatar,
        updatedAt: users.updatedAt
      })

    return updatedUser
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself')
    }

    // Check if already following
    const [existingFollow] = await db.select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      ))
      .limit(1)

    if (existingFollow) {
      throw new Error('Already following this user')
    }

    // Check if user to follow exists
    const [userToFollow] = await db.select()
      .from(users)
      .where(and(eq(users.id, followingId), eq(users.isActive, true)))
      .limit(1)

    if (!userToFollow) {
      throw new Error('User not found')
    }

    // Create follow relationship
    await db.insert(userFollows).values({
      followerId,
      followingId
    })

    return { success: true, message: 'User followed successfully' }
  }

  async unfollowUser(followerId: string, followingId: string) {
    const result = await db.delete(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      ))

    return { success: true, message: 'User unfollowed successfully' }
  }

  async searchUsers(query: string, limit = 20, offset = 0, excludeUserId?: string) {
    let whereClause = and(
      or(
        ilike(users.username, `%${query}%`),
        ilike(users.firstName, `%${query}%`),
        ilike(users.lastName, `%${query}%`)
      ),
      eq(users.isActive, true)
    )

    if (excludeUserId) {
      whereClause = and(whereClause, eq(users.id, excludeUserId))
    }

    const searchResults = await db.select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      avatar: users.avatar,
      bio: users.bio,
      isVerified: users.isVerified,
      isOnline: users.isOnline
    }).from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt))

    return searchResults
  }

  private async storeRefreshToken(userId: string, refreshToken: string, ipAddress: string, userAgent: string) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await db.insert(userSessions).values({
      userId,
      refreshToken,
      ipAddress,
      userAgent,
      expiresAt
    })
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Get user with password hash
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isValidPassword = await passwordService.comparePassword(currentPassword, user.passwordHash)
    if (!isValidPassword) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const newPasswordHash = await passwordService.hashPassword(newPassword)

    // Update password
    await db.update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))

    // Invalidate all refresh tokens for this user (force re-login on all devices)
    await db.delete(userSessions)
      .where(eq(userSessions.userId, userId))

    return { success: true, message: 'Password changed successfully' }
  }

  async getUsersBatch(userIds: string[]) {
    // Normalize and short-circuit
    const ids = Array.from(new Set(userIds)).filter(Boolean);
    if (ids.length === 0) return [];

    // Chunk to stay well under Postgres' parameter limit
    const CHUNK_SIZE = 1000; // adjust as needed
    const rows: Array<{
      id: string;
      username: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
      bio: string | null;
      isVerified: boolean;
      isOnline: boolean;
      lastSeen: Date | null;
    }> = [];

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const slice = ids.slice(i, i + CHUNK_SIZE);

      // IMPORTANT: do not shadow the `users` table symbol; use a different local name
      const chunkRows = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
          bio: users.bio,
          isVerified: sql<boolean>`coalesce(${users.isVerified}, false)`.as('isVerified'),
          isOnline: sql<boolean>`coalesce(${users.isOnline}, false)`.as('isOnline'),
          lastSeen: users.lastSeen,
        })
        .from(users)
        .where(and(inArray(users.id, slice), eq(users.isActive, true)));

      rows.push(...chunkRows);
    }

    // Preserve original input order; SQL order is undefined without ORDER BY
    const byId = new Map(rows.map((u) => [u.id, u]));
    return userIds
      .map((id) => byId.get(id))
      .filter((u): u is NonNullable<typeof u> => Boolean(u));
  }

}

export const userService = new UserService()

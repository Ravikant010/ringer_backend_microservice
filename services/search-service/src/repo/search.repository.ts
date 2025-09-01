import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { db } from '../database'
import { userSearchIndex, postSearchIndex } from '../database/schema'

export class SearchRepository {
  async searchUsers(query: string, limit: number, offset: number) {
    // First try exact username matches
    const exactMatches = await db.select({
      userId: userSearchIndex.userId,
      username: userSearchIndex.username,
      firstName: userSearchIndex.firstName,
      lastName: userSearchIndex.lastName,
      bio: userSearchIndex.bio,
      rank: sql<number>`1`,
    })
    .from(userSearchIndex)
    .where(and(
      eq(userSearchIndex.isActive, true),
      ilike(userSearchIndex.username, `${query}%`)
    ))
    .limit(5)

    // Then try full-text search if we need more results
    const searchResults = await db.execute(sql`
      SELECT 
        user_id,
        username,
        first_name,
        last_name,
        bio,
        ts_rank_cd(to_tsvector('english', 
          coalesce(username, '') || ' ' || 
          coalesce(first_name, '') || ' ' || 
          coalesce(last_name, '') || ' ' ||
          coalesce(bio, '')
        ), plainto_tsquery('english', ${query})) as rank
      FROM user_search_index
      WHERE is_active = true
        AND (
          to_tsvector('english', 
            coalesce(username, '') || ' ' || 
            coalesce(first_name, '') || ' ' || 
            coalesce(last_name, '') || ' ' ||
            coalesce(bio, '')
          ) @@ plainto_tsquery('english', ${query})
          OR username ILIKE ${'%' + query + '%'}
          OR first_name ILIKE ${'%' + query + '%'}
          OR last_name ILIKE ${'%' + query + '%'}
        )
      ORDER BY rank DESC, username ASC
      LIMIT ${limit} OFFSET ${offset}
    `)

    return searchResults.rows.map(row => ({
      userId: row.user_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      bio: row.bio,
      relevanceScore: Number(row.rank),
    }))
  }

  async searchPosts(query: string, limit: number, offset: number, authorId?: string) {
    let whereClause = sql`is_deleted = false`
    
    if (authorId) {
      whereClause = sql`${whereClause} AND author_id = ${authorId}`
    }

    const searchResults = await db.execute(sql`
      SELECT 
        post_id,
        author_id,
        content,
        created_at,
        ts_rank_cd(
          to_tsvector('english', content), 
          plainto_tsquery('english', ${query})
        ) as rank
      FROM post_search_index
      WHERE ${whereClause}
        AND (
          to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
          OR content ILIKE ${'%' + query + '%'}
        )
      ORDER BY rank DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    return searchResults.rows.map(row => ({
      postId: row.post_id,
      authorId: row.author_id,
      content: row.content,
      createdAt: row.created_at,
      relevanceScore: Number(row.rank),
    }))
  }

  // Methods to sync data from other services (would be called by webhooks or scheduled jobs)
  async syncUser(userData: {
    userId: string; username: string; firstName?: string; 
    lastName?: string; bio?: string; isActive: boolean;
  }) {
    await db.insert(userSearchIndex)
      .values({
        userId: userData.userId,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        bio: userData.bio,
        isActive: userData.isActive,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: userSearchIndex.userId,
        set: {
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          bio: userData.bio,
          isActive: userData.isActive,
          lastUpdated: new Date(),
        },
      })
  }

  async syncPost(postData: {
    postId: string; authorId: string; content: string; 
    isDeleted: boolean; createdAt: Date;
  }) {
    await db.insert(postSearchIndex)
      .values({
        postId: postData.postId,
        authorId: postData.authorId,
        content: postData.content,
        isDeleted: postData.isDeleted,
        createdAt: postData.createdAt,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: postSearchIndex.postId,
        set: {
          content: postData.content,
          isDeleted: postData.isDeleted,
          lastUpdated: new Date(),
        },
      })
  }
}

export const searchRepository = new SearchRepository()

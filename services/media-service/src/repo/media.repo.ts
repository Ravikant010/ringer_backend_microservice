import crypto from 'crypto'
import { and, desc, eq, lt } from 'drizzle-orm'
import { db } from '../database'
import { mediaObjects } from '../database/schema'

export class MediaRepository {
  async create(params: {
    ownerId: string; originalName: string; filename: string; storageKey: string;
    url: string; mimeType: string; fileSize: number; width?: number; height?: number;
  }) {
    const checksum = crypto.createHash('sha256').update(params.storageKey).digest('hex')
    
    const [media] = await db.insert(mediaObjects).values({
      ...params,
      checksum,
    }).returning()
    
    return media
  }

  async getById(id: string, ownerId?: string) {
    let query = db.select().from(mediaObjects)
      .where(and(eq(mediaObjects.id, id), eq(mediaObjects.isDeleted, false)))
    
    if (ownerId) {
      query = query.where(eq(mediaObjects.ownerId, ownerId))
    }
    
    const results = await query.limit(1)
    return results[0] ?? null
  }

  async listByOwner(ownerId: string, limit: number, cursor?: string) {
    const baseCondition = and(
      eq(mediaObjects.ownerId, ownerId),
      eq(mediaObjects.isDeleted, false)
    )
    
    const whereCondition = cursor
      ? and(baseCondition, lt(mediaObjects.id, cursor))
      : baseCondition

    const results = await db.select().from(mediaObjects)
      .where(whereCondition)
      .orderBy(desc(mediaObjects.createdAt), desc(mediaObjects.id))
      .limit(limit + 1)

    const hasMore = results.length > limit
    const items = hasMore ? results.slice(0, limit) : results
    const nextCursor = hasMore ? items[items.length - 1].id : undefined

    return { items, nextCursor, hasMore }
  }

  async softDelete(id: string, ownerId: string) {
    const [deleted] = await db.update(mediaObjects)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(
        eq(mediaObjects.id, id),
        eq(mediaObjects.ownerId, ownerId),
        eq(mediaObjects.isDeleted, false)
      ))
      .returning()
    
    return deleted ?? null
  }

  async findByChecksum(checksum: string, ownerId: string) {
    const results = await db.select().from(mediaObjects)
      .where(and(
        eq(mediaObjects.checksum, checksum),
        eq(mediaObjects.ownerId, ownerId),
        eq(mediaObjects.isDeleted, false)
      ))
      .limit(1)
    
    return results[0] ?? null
  }
}

export const mediaRepository = new MediaRepository()

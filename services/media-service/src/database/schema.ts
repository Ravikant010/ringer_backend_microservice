import {
  pgTable, uuid, varchar, text, timestamp, integer, boolean, index,
} from 'drizzle-orm/pg-core'

export const mediaObjects = pgTable(
  'media_objects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    filename: varchar('filename', { length: 255 }).notNull(),
    storageKey: text('storage_key').notNull(),        // file path/key in storage
    url: text('url').notNull(),                       // accessible URL
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileSize: integer('file_size').notNull(),         // bytes
    width: integer('width'),                          // for images
    height: integer('height'),                        // for images
    checksum: varchar('checksum', { length: 128 }),   // SHA-256 for deduplication
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byOwnerCreatedAt: index('idx_media_owner_created_at').on(t.ownerId, t.createdAt),
    byCreatedAt: index('idx_media_created_at').on(t.createdAt),
    byChecksum: index('idx_media_checksum').on(t.checksum),
  }),
)

import { pgTable, uuid, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const follows = pgTable(
    'follows',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        followerId: uuid('follower_id').notNull(),
        followingId: uuid('following_id').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        followerIdx: index('idx_follows_follower').on(table.followerId),
        followingIdx: index('idx_follows_following').on(table.followingId),

        uniqueFollowIdx: uniqueIndex('idx_unique_follow').on(table.followerId, table.followingId),

    })
);

export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;

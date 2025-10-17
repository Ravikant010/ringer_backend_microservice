import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../database';
import { follows } from '../database/schema';
import { kafkaService } from '../events/kafka.service';
import { TOPICS } from '../events/types';

export class FollowRepository {
    async follow(followerId: string, followingId: string) {
        if (followerId === followingId) {
            throw new Error('Cannot follow yourself');
        }

        try {
            const [follow] = await db
                .insert(follows)
                .values({ followerId, followingId })
                .onConflictDoNothing()
                .returning();

            if (!follow) {
                throw new Error('Already following this user');
            }

            await kafkaService.publishEvent(TOPICS.USER_FOLLOWED, {
                eventType: 'user.followed',
                followerId,
                followingId,
                timestamp: new Date().toISOString(),
            });

            return follow;
        } catch (error: any) {
            throw error;
        }
    }

    async unfollow(followerId: string, followingId: string) {
        const result = await db
            .delete(follows)
            .where(
                and(
                    eq(follows.followerId, followerId),
                    eq(follows.followingId, followingId)
                )
            )
            .returning();

        if (result.length > 0) {
            await kafkaService.publishEvent(TOPICS.USER_UNFOLLOWED, {
                eventType: 'user.unfollowed',
                followerId,
                followingId,
                timestamp: new Date().toISOString(),
            });
        }

        return { success: true, unfollowed: result.length > 0 };
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const [result] = await db
            .select({ id: follows.id })
            .from(follows)
            .where(
                and(
                    eq(follows.followerId, followerId),
                    eq(follows.followingId, followingId)
                )
            )
            .limit(1);

        return !!result;
    }

    async getFollowers(userId: string, limit: number = 20) {
        const results = await db
            .select({ followerId: follows.followerId })
            .from(follows)
            .where(eq(follows.followingId, userId))
            .orderBy(desc(follows.createdAt))
            .limit(limit);

        return results.map(r => r.followerId);
    }

    async getFollowing(userId: string, limit: number = 20) {
        const results = await db
            .select({ followingId: follows.followingId })
            .from(follows)
            .where(eq(follows.followerId, userId))
            .orderBy(desc(follows.createdAt))
            .limit(limit);

        return results.map(r => r.followingId);
    }

    async getCounts(userId: string) {
        const [followerCount] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(follows)
            .where(eq(follows.followingId, userId));

        const [followingCount] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(follows)
            .where(eq(follows.followerId, userId));

        return {
            followers: followerCount?.count || 0,
            following: followingCount?.count || 0,
        };
    }
}

export const followRepository = new FollowRepository();

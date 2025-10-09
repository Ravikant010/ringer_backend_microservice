import { EachMessagePayload } from 'kafkajs';
import { db } from '../database';
import { posts } from '../database/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

export async function handleCommentCountChange(payload: EachMessagePayload) {
    const event = JSON.parse(payload.message.value!.toString());

    logger.info('Processing comment count change:', event);

    try {
        await db.update(posts)
            .set({
                commentCount: sql`GREATEST(${posts.commentCount} + ${event.delta}, 0)`
            })
            .where(eq(posts.id, event.postId));

        logger.info(`Updated comment count for post ${event.postId} by ${event.delta}`);
    } catch (error) {
        logger.error('Failed to update comment count:', error);
    }
}

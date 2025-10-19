// notification-service/src/events/kafka.consumer.ts
import { Kafka } from 'kafkajs';
import { notificationRepo } from '../database/repository';
import { logger } from '../utils/logger';

class NotificationKafkaConsumer {
    private kafka: Kafka;
    private consumer;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'notification-service',
            brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
            retry: {
                retries: 8,
                initialRetryTime: 100,
                multiplier: 2,
            },
        });
        this.consumer = this.kafka.consumer({ groupId: 'notification-service-group' });
    }

    async connect() {
        try {
            await this.consumer.connect();
            logger.info('Notification Kafka consumer connected');

            // Subscribe to all relevant topics
            await this.consumer.subscribe({
                topics: [
                    'comment.created',
                    'comment.liked',
                    'post.liked',
                ],
                fromBeginning: false,
            });

            await this.consumer.run({
                eachMessage: async ({ topic, message }) => {
                    try {
                        const event = JSON.parse(message.value?.toString() || '{}');
                        logger.info(`Processing event from ${topic}:`, event);

                        await this.handleEvent(topic, event);
                    } catch (error) {
                        logger.error(`Error processing message from ${topic}:`, error);
                    }
                },
            });

            logger.info('Notification consumer started');
        } catch (error) {
            logger.error('Failed to start Kafka consumer:', error);
            throw error;
        }
    }

    private async handleEvent(topic: string, event: any) {
        switch (topic) {
            case 'comment.created':
                await this.handleCommentCreated(event);
                break;
            case 'comment.liked':
                await this.handleCommentLiked(event);
                break;
            case 'post.liked':
                await this.handlePostLiked(event);
                break;
            default:
                logger.warn(`Unhandled topic: ${topic}`);
        }
    }

    private async handleCommentCreated(event: any) {
        const { commentId, postId, userId } = event;

        // Fetch post details to get the post author
        const postServiceUrl = process.env.POST_SERVICE_URL || 'http://localhost:3002';
        const postRes = await fetch(`${postServiceUrl}/api/v1/posts/${postId}`);

        if (!postRes.ok) {
            logger.error(`Failed to fetch post ${postId}`);
            return;
        }

        const postData:any = await postRes.json();
        const postAuthorId = postData.data.authorId;

        // Don't notify if user comments on their own post
        if (postAuthorId === userId) return;

        await notificationRepo.create({
            userId: postAuthorId,
            actorId: userId,
            postId,
            commentId,
            type: 'comment_on_post',
            title: 'New comment on your post',
            body: 'Someone commented on your post.',
        });

        logger.info(`Created comment notification for user ${postAuthorId}`);
    }

    private async handleCommentLiked(event: any) {
        const { commentId, postId, userId } = event;

        // Fetch comment details to get the comment author
        const commentServiceUrl = process.env.COMMENT_SERVICE_URL || 'http://localhost:3003';
        const commentRes = await fetch(`${commentServiceUrl}/api/v1/comments/${commentId}`);

        if (!commentRes.ok) {
            logger.error(`Failed to fetch comment ${commentId}`);
            return;
        }

        const commentData:any = await commentRes.json();
        const commentAuthorId = commentData.data.userId;

        // Don't notify if user likes their own comment
        if (commentAuthorId === userId) return;

        await notificationRepo.create({
            userId: commentAuthorId,
            actorId: userId,
            postId,
            commentId,
            type: 'comment_liked',
            title: 'Someone liked your comment',
            body: 'Your comment received a like.',
        });

        logger.info(`Created comment like notification for user ${commentAuthorId}`);
    }

    private async handlePostLiked(event: any) {
        const { postId, userId, authorId } = event;

        // Don't notify if user likes their own post
        if (authorId === userId) return;

        await notificationRepo.create({
            userId: authorId,
            actorId: userId,
            postId,
            type: 'post_liked',
            title: 'Someone liked your post',
            body: 'Your post received a like.',
        });

        logger.info(`Created post like notification for user ${authorId}`);
    }

    async disconnect() {
        await this.consumer.disconnect();
        logger.info('Notification Kafka consumer disconnected');
    }
}

export const notificationConsumer = new NotificationKafkaConsumer();

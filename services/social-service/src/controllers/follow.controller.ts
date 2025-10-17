import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { followRepository } from '../repositories/follow.repository';
import { env } from '../config/env';

class FollowController {
    async follow(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const { targetUserId } = req.body;

            if (!targetUserId) {
                return res.status(400).json({
                    success: false,
                    error: 'targetUserId is required',
                });
            }

            await followRepository.follow(userId, targetUserId);

            res.status(201).json({
                success: true,
                message: 'Successfully followed user',
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    async unfollow(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const { targetUserId } = req.params;

            await followRepository.unfollow(userId, targetUserId);

            res.json({
                success: true,
                message: 'Successfully unfollowed user',
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    async isFollowing(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const { targetUserId } = req.params;

            const isFollowing = await followRepository.isFollowing(userId, targetUserId);

            res.json({
                success: true,
                data: { isFollowing },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    async getFollowers(req: AuthenticatedRequest, res: Response) {
        try {
            const { userId } = req.params;
            const limit = parseInt(req.query.limit as string) || 20;

            const userIds = await followRepository.getFollowers(userId, limit);

            // Fetch user data from user-service
            const usersResponse = await fetch(`${env.userServiceUrl}/api/v1/users/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: userIds }),
            });

            const usersData = await usersResponse.json();

            res.json({
                success: true,
                data: usersData.users || usersData.data || [],
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    async getFollowing(req: AuthenticatedRequest, res: Response) {
        try {
            const { userId } = req.params;
            const limit = parseInt(req.query.limit as string) || 20;

            const userIds = await followRepository.getFollowing(userId, limit);

            // Fetch user data from user-service
            const usersResponse = await fetch(`${env.userServiceUrl}/api/v1/users/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: userIds }),
            });

            const usersData = await usersResponse.json();

            res.json({
                success: true,
                data: usersData.users || usersData.data || [],
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    async getCounts(req: AuthenticatedRequest, res: Response) {
        try {
            const { userId } = req.params;

            const counts = await followRepository.getCounts(userId);

            res.json({
                success: true,
                data: counts,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
}

export const followController = new FollowController();

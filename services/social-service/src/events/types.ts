export const TOPICS = {
  USER_FOLLOWED: 'user.followed',
  USER_UNFOLLOWED: 'user.unfollowed',
} as const;

export interface UserFollowedEvent {
  eventType: 'user.followed';
  followerId: string;
  followingId: string;
  timestamp: string;
}

export interface UserUnfollowedEvent {
  eventType: 'user.unfollowed';
  followerId: string;
  followingId: string;
  timestamp: string;
}

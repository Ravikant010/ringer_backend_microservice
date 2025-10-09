export interface CommentCreatedEvent {
    eventType: 'comment.created';
    commentId: string;
    postId: string;
    userId: string;
    content: string;
    parentCommentId?: string;
    timestamp: string;
}

export interface CommentDeletedEvent {
    eventType: 'comment.deleted';
    commentId: string;
    postId: string;
    userId: string;
    timestamp: string;
}

export interface CommentLikedEvent {
    eventType: 'comment.liked';
    commentId: string;
    postId: string;
    userId: string;
    timestamp: string;
}

export interface CommentUnlikedEvent {
    eventType: 'comment.unliked';
    commentId: string;
    postId: string;
    userId: string;
    timestamp: string;
}

// Post service will consume this to update comment_count
export interface PostCommentCountChangedEvent {
    eventType: 'post.comment_count.changed';
    postId: string;
    delta: number; // +1 or -1
    timestamp: string;
}

export const TOPICS = {
    COMMENT_CREATED: 'comment.created',
    COMMENT_DELETED: 'comment.deleted',
    COMMENT_LIKED: 'comment.liked',
    COMMENT_UNLIKED: 'comment.unliked',
    POST_COMMENT_COUNT_CHANGED: 'post.comment_count.changed',
} as const;

export interface PostLikedEvent {
    eventType: 'post.liked';
    postId: string;
    userId: string;
    authorId: string;
    timestamp: string;
}

export interface PostUnlikedEvent {
    eventType: 'post.unliked';
    postId: string;
    userId: string;
    authorId: string;
    timestamp: string;
}

export interface CommentCreatedEvent {
    eventType: 'comment.created';
    commentId: string;
    postId: string;
    authorId: string;
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

export const TOPICS = {
    POST_LIKED: 'post.liked',
    POST_UNLIKED: 'post.unliked',
    COMMENT_CREATED: 'comment.created',
    COMMENT_DELETED: 'comment.deleted',
} as const;

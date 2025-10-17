export const TOPICS = {
  MESSAGE_SENT: 'message.sent',
  MESSAGE_READ: 'message.read',
} as const;

export interface MessageSentEvent {
  eventType: 'message.sent';
  messageId: string;
  conversationId: string;
  senderId: string;
  timestamp: string;
}

export interface MessageReadEvent {
  eventType: 'message.read';
  conversationId: string;
  userId: string;
  timestamp: string;
}

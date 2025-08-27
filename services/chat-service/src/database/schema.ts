import {
  pgTable, uuid, text, timestamp, boolean, pgEnum, index, uniqueIndex,
} from 'drizzle-orm/pg-core'

export const messageStatusEnum = pgEnum('message_status', ['sent', 'delivered', 'read'])

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    senderId: uuid('sender_id').notNull(),      // references users.id (remote)
    receiverId: uuid('receiver_id').notNull(),   // references users.id (remote)
    content: text('content').notNull(),
    status: messageStatusEnum('status').notNull().default('sent'),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bySenderCreatedAt: index('idx_messages_sender_created_at').on(t.senderId, t.createdAt),
    byReceiverCreatedAt: index('idx_messages_receiver_created_at').on(t.receiverId, t.createdAt),
    byConversationCreatedAt: index('idx_messages_conversation_created_at').on(t.senderId, t.receiverId, t.createdAt),
  }),
)

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user1Id: uuid('user1_id').notNull(),
    user2Id: uuid('user2_id').notNull(),
    lastMessageId: uuid('last_message_id'),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uxUsers: uniqueIndex('ux_conversations_users').on(t.user1Id, t.user2Id),
    byUser1Updated: index('idx_conversations_user1_updated').on(t.user1Id, t.updatedAt),
    byUser2Updated: index('idx_conversations_user2_updated').on(t.user2Id, t.updatedAt),
  }),
)

export const userPresence = pgTable(
  'user_presence',
  {
    userId: uuid('user_id').primaryKey(),
    isOnline: boolean('is_online').notNull().default(false),
    lastSeen: timestamp('last_seen', { withTimezone: true }).notNull().defaultNow(),
    socketId: text('socket_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
)

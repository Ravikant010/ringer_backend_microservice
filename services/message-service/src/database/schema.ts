import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    participant1Id: uuid('participant1_id').notNull(),
    participant2Id: uuid('participant2_id').notNull(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    participant1Idx: index('idx_conversations_participant1').on(table.participant1Id),
    participant2Idx: index('idx_conversations_participant2').on(table.participant2Id),
  })
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').notNull(),
    content: text('content').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    conversationIdx: index('idx_messages_conversation').on(table.conversationId),
    senderIdx: index('idx_messages_sender').on(table.senderId),
    createdAtIdx: index('idx_messages_created').on(table.createdAt),
  })
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

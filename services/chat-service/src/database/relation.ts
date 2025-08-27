import { relations } from 'drizzle-orm'
import { messages, conversations, userPresence } from './schema'

export const messagesRelations = relations(messages, ({ one }) => ({
  // Note: sender/receiver would relate to users table in user-service (cross-service)
}))

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  lastMessage: one(messages, {
    fields: [conversations.lastMessageId],
    references: [messages.id],
  }),
}))

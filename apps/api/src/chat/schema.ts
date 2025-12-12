import { relations } from 'drizzle-orm';
import { pgTable, uuid, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const chats = pgTable('chat_conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const chatRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}));

export const messages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chat_conversations')
    .notNull()
    .references(() => chats.id, { onDelete: 'cascade' }),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  content: jsonb('content').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const messageRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export type StoredChat = typeof chats.$inferSelect;
export type StoredMessage = typeof messages.$inferSelect;

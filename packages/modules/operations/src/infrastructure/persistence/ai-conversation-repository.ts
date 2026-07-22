import { count, desc, eq } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { AdminId, ConversationId, MessageId } from "@workspace/types/ids"

import type { AiConversationRepository } from "#operations/application/ports/operations-ports"
import type {
  AiConversation,
  AiConversationHistory,
  AiConversationSummary,
  AiMessage,
} from "#operations/domain/ai-conversation"
import {
  operationsAiConversations,
  operationsAiMessages,
} from "#operations/infrastructure/persistence/schema"

type ConversationRow = typeof operationsAiConversations.$inferSelect
type MessageRow = typeof operationsAiMessages.$inferSelect

export function createAiConversationRepository(
  database: WritingAppDatabase
): AiConversationRepository {
  return Object.freeze({
    async createUserMessage(input) {
      const conversation =
        input.conversationId === null
          ? createConversation(database, input)
          : readOwnedConversation(database, input.adminId, input.conversationId)
      if (conversation === null) return null

      database
        .insert(operationsAiMessages)
        .values({
          content: input.message,
          conversationId: conversation.id,
          createdAt: input.now,
          id: `admin-ai-message-${crypto.randomUUID()}`,
          role: "user",
        })
        .run()
      database
        .update(operationsAiConversations)
        .set({ updatedAt: input.now })
        .where(eq(operationsAiConversations.id, conversation.id))
        .run()
      return readHistory(database, conversation, 1, 100)
    },
    async readConversation(input) {
      const conversation = readOwnedConversation(
        database,
        input.adminId,
        input.conversationId
      )
      return conversation === null
        ? null
        : readHistory(
            database,
            conversation,
            input.messagePage,
            input.messagePageSize
          )
    },
    async readConversations(input) {
      return database
        .select()
        .from(operationsAiConversations)
        .where(eq(operationsAiConversations.adminId, input.adminId))
        .orderBy(desc(operationsAiConversations.updatedAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize)
        .all()
        .map((conversation) => toSummary(database, conversation))
    },
    async saveAssistantMessage(input) {
      const row = {
        content: input.content,
        conversationId: input.conversationId,
        createdAt: input.now,
        id: `admin-ai-message-${crypto.randomUUID()}`,
        role: "assistant" as const,
      }
      database.insert(operationsAiMessages).values(row).run()
      database
        .update(operationsAiConversations)
        .set({ updatedAt: input.now })
        .where(eq(operationsAiConversations.id, input.conversationId))
        .run()
      return toMessage(row)
    },
  })
}

function createConversation(
  database: WritingAppDatabase,
  input: Readonly<{ adminId: AdminId; message: string; now: Date }>
): ConversationRow {
  const conversation = {
    adminId: input.adminId,
    createdAt: input.now,
    id: `admin-ai-chat-${crypto.randomUUID()}`,
    title: createTitle(input.message),
    updatedAt: input.now,
  }
  database.insert(operationsAiConversations).values(conversation).run()
  return conversation
}

function readOwnedConversation(
  database: WritingAppDatabase,
  adminId: AdminId,
  conversationId: ConversationId
): ConversationRow | null {
  const conversation = database
    .select()
    .from(operationsAiConversations)
    .where(eq(operationsAiConversations.id, conversationId))
    .get()
  return conversation === undefined || conversation.adminId !== adminId
    ? null
    : conversation
}

function readHistory(
  database: WritingAppDatabase,
  conversation: ConversationRow,
  page: number,
  pageSize: number
): AiConversationHistory {
  const messages = database
    .select()
    .from(operationsAiMessages)
    .where(eq(operationsAiMessages.conversationId, conversation.id))
    .orderBy(desc(operationsAiMessages.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()
    .reverse()
  return Object.freeze({
    conversation: toSummary(database, conversation),
    messages: Object.freeze(messages.map(toMessage)),
  })
}

function toSummary(
  database: WritingAppDatabase,
  row: ConversationRow
): AiConversationSummary {
  return Object.freeze({
    conversation: toConversation(row),
    messageCount:
      database
        .select({ value: count() })
        .from(operationsAiMessages)
        .where(eq(operationsAiMessages.conversationId, row.id))
        .get()?.value ?? 0,
  })
}

function toConversation(row: ConversationRow): AiConversation {
  return Object.freeze({
    adminId: row.adminId as AdminId,
    createdAt: row.createdAt,
    id: row.id as ConversationId,
    title: row.title,
    updatedAt: row.updatedAt,
  })
}

function toMessage(row: MessageRow): AiMessage {
  return Object.freeze({
    content: row.content,
    conversationId: row.conversationId as ConversationId,
    createdAt: row.createdAt,
    id: row.id as MessageId,
    role: row.role,
  })
}

function createTitle(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim()
  return normalized.length <= 40 ? normalized : `${normalized.slice(0, 40)}...`
}

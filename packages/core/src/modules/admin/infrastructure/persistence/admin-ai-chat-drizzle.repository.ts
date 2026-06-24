import type {
  AdminAiChatConversationDetailDto,
  AdminAiChatConversationDto,
  AdminAiChatConversationListDto,
  AdminAiChatMessageDto,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  AiChatAdminRepository,
  CreateAdminAiChatUserMessageInput,
  ReadAdminAiChatConversationInput,
  ReadAdminAiChatConversationsInput,
  SaveAdminAiChatAssistantMessageInput,
} from "@workspace/core/modules/admin/application/ports/admin.repository"
import { asc, count, desc, eq } from "drizzle-orm"

import type { WritingAppDatabase } from "@workspace/db/client"
import {
  adminAiChatConversations,
  adminAiChatMessages,
} from "@workspace/db/schema"

type AiChatConversationRow = typeof adminAiChatConversations.$inferSelect
type AiChatMessageRow = typeof adminAiChatMessages.$inferSelect

export function createAdminAiChatRepository(
  db: WritingAppDatabase
): AiChatAdminRepository {
  return {
    createAiChatUserMessage(input) {
      return Promise.resolve(createAiChatUserMessage(db, input))
    },
    readAiChatConversation(input) {
      return Promise.resolve(readAiChatConversation(db, input))
    },
    readAiChatConversations(input) {
      return Promise.resolve(readAiChatConversations(db, input))
    },
    saveAiChatAssistantMessage(input) {
      return Promise.resolve(saveAiChatAssistantMessage(db, input))
    },
  }
}

function readAiChatConversations(
  db: WritingAppDatabase,
  input: ReadAdminAiChatConversationsInput
): AdminAiChatConversationListDto {
  const conversations = db
    .select()
    .from(adminAiChatConversations)
    .where(eq(adminAiChatConversations.adminId, input.adminId))
    .orderBy(desc(adminAiChatConversations.updatedAt))
    .all()

  return {
    items: conversations.map((conversation) =>
      toConversationDto(db, conversation)
    ),
  }
}

function readAiChatConversation(
  db: WritingAppDatabase,
  input: ReadAdminAiChatConversationInput
): AdminAiChatConversationDetailDto | null {
  const conversation = db
    .select()
    .from(adminAiChatConversations)
    .where(eq(adminAiChatConversations.id, input.conversationId))
    .get()

  if (conversation === undefined || conversation.adminId !== input.adminId) {
    return null
  }

  return toConversationDetailDto(db, conversation)
}

function createAiChatUserMessage(
  db: WritingAppDatabase,
  input: CreateAdminAiChatUserMessageInput
): AdminAiChatConversationDetailDto | null {
  const conversation =
    input.conversationId === null
      ? createConversation(db, input)
      : readOwnedConversation(db, {
          adminId: input.adminId,
          conversationId: input.conversationId,
        })

  if (conversation === null) {
    return null
  }

  db.insert(adminAiChatMessages)
    .values({
      content: input.message,
      conversationId: conversation.id,
      createdAt: input.now,
      id: `admin-ai-message-${crypto.randomUUID()}`,
      role: "user",
    })
    .run()
  db.update(adminAiChatConversations)
    .set({
      updatedAt: input.now,
    })
    .where(eq(adminAiChatConversations.id, conversation.id))
    .run()

  return readAiChatConversation(db, {
    adminId: input.adminId,
    conversationId: conversation.id,
  })
}

function saveAiChatAssistantMessage(
  db: WritingAppDatabase,
  input: SaveAdminAiChatAssistantMessageInput
): AdminAiChatMessageDto {
  const message = {
    content: input.content,
    conversationId: input.conversationId,
    createdAt: input.now,
    id: `admin-ai-message-${crypto.randomUUID()}`,
    role: "assistant" as const,
  }

  db.insert(adminAiChatMessages).values(message).run()
  db.update(adminAiChatConversations)
    .set({
      updatedAt: input.now,
    })
    .where(eq(adminAiChatConversations.id, input.conversationId))
    .run()

  return toMessageDto(message)
}

function createConversation(
  db: WritingAppDatabase,
  input: CreateAdminAiChatUserMessageInput
): AiChatConversationRow {
  const conversation = {
    adminId: input.adminId,
    createdAt: input.now,
    id: `admin-ai-chat-${crypto.randomUUID()}`,
    title: createConversationTitle(input.message),
    updatedAt: input.now,
  }

  db.insert(adminAiChatConversations).values(conversation).run()

  return conversation
}

function readOwnedConversation(
  db: WritingAppDatabase,
  input: ReadAdminAiChatConversationInput
): AiChatConversationRow | null {
  const conversation = db
    .select()
    .from(adminAiChatConversations)
    .where(eq(adminAiChatConversations.id, input.conversationId))
    .get()

  if (conversation === undefined || conversation.adminId !== input.adminId) {
    return null
  }

  return conversation
}

function toConversationDetailDto(
  db: WritingAppDatabase,
  conversation: AiChatConversationRow
): AdminAiChatConversationDetailDto {
  const messages = db
    .select()
    .from(adminAiChatMessages)
    .where(eq(adminAiChatMessages.conversationId, conversation.id))
    .orderBy(asc(adminAiChatMessages.createdAt))
    .all()

  return {
    conversation: toConversationDto(db, conversation),
    messages: messages.map(toMessageDto),
  }
}

function toConversationDto(
  db: WritingAppDatabase,
  conversation: AiChatConversationRow
): AdminAiChatConversationDto {
  const messageCount =
    db
      .select({ value: count() })
      .from(adminAiChatMessages)
      .where(eq(adminAiChatMessages.conversationId, conversation.id))
      .get()?.value ?? 0

  return {
    createdAt: conversation.createdAt.toISOString(),
    id: conversation.id,
    messageCount,
    title: conversation.title,
    updatedAt: conversation.updatedAt.toISOString(),
  }
}

function toMessageDto(message: AiChatMessageRow): AdminAiChatMessageDto {
  return {
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    id: message.id,
    role: message.role,
  }
}

function createConversationTitle(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim()

  return normalized.length <= 40 ? normalized : `${normalized.slice(0, 40)}...`
}

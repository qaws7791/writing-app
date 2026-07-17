import type {
  AdminAiChatConversationDto,
  AdminAiChatMessageDto,
  ConversationId,
} from "@workspace/contracts/admin/ai-chat-data"
import type { AdminId } from "@workspace/contracts/admin/identity-data"

export type ReadAdminAiChatConversationsInput = {
  readonly adminId: AdminId
  readonly page: number
  readonly pageSize: number
}

export type AdminAiChatConversationHistory = {
  readonly conversation: AdminAiChatConversationDto
  readonly messageItems: readonly AdminAiChatMessageDto[]
}

export type ReadAdminAiChatConversationsResult =
  readonly AdminAiChatConversationDto[]

export type ReadAdminAiChatConversationInput = {
  readonly adminId: AdminId
  readonly conversationId: ConversationId
  readonly messagePage: number
  readonly messagePageSize: number
}

export type CreateAdminAiChatUserMessageInput = {
  readonly adminId: AdminId
  readonly conversationId: ConversationId | null
  readonly message: string
  readonly now: Date
}

export type SaveAdminAiChatAssistantMessageInput = {
  readonly content: string
  readonly conversationId: ConversationId
  readonly now: Date
}

export type AiChatRepository = {
  readonly createAiChatUserMessage: (
    input: CreateAdminAiChatUserMessageInput
  ) => Promise<AdminAiChatConversationHistory | null>
  readonly readAiChatConversation: (
    input: ReadAdminAiChatConversationInput
  ) => Promise<AdminAiChatConversationHistory | null>
  readonly readAiChatConversations: (
    input: ReadAdminAiChatConversationsInput
  ) => Promise<ReadAdminAiChatConversationsResult>
  readonly saveAiChatAssistantMessage: (
    input: SaveAdminAiChatAssistantMessageInput
  ) => Promise<AdminAiChatMessageDto>
}

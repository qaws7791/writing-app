import type { AdminId, ConversationId, MessageId } from "@workspace/types/ids"

export type AiConversation = Readonly<{
  adminId: AdminId
  createdAt: Date
  id: ConversationId
  title: string
  updatedAt: Date
}>

export type AiMessage = Readonly<{
  content: string
  conversationId: ConversationId
  createdAt: Date
  id: MessageId
  role: "assistant" | "user"
}>

export type AiConversationSummary = Readonly<{
  conversation: AiConversation
  messageCount: number
}>

export type AiConversationHistory = Readonly<{
  conversation: AiConversationSummary
  messages: readonly AiMessage[]
}>

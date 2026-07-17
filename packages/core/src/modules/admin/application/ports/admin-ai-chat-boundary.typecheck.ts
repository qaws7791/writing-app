import type { AiChatRepository } from "#core/modules/admin/application/ports/admin-ai-chat.repository"

type Assert<TValue extends true> = TValue
type Equal<TLeft, TRight> = [TLeft] extends [TRight]
  ? [TRight] extends [TLeft]
    ? true
    : false
  : false

export type AdminAiChatBoundary = [
  Assert<
    Equal<
      keyof AiChatRepository,
      | "createAiChatUserMessage"
      | "readAiChatConversation"
      | "readAiChatConversations"
      | "saveAiChatAssistantMessage"
    >
  >,
]

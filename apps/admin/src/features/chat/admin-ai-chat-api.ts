import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import {
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
  type AdminAiChatConversationDto,
} from "@workspace/contracts/admin"

export type AdminAiChatMessage = {
  readonly content: string
  readonly createdAt: string
  readonly id: string
  readonly role: "assistant" | "user"
}
export type AdminAiChatConversation = {
  readonly createdAt: string
  readonly id: string
  readonly messageCount: number
  readonly title: string
  readonly updatedAt: string
}
export type AdminAiChatConversationList = {
  readonly items: readonly AdminAiChatConversation[]
}
export type AdminAiChatConversationDetail = {
  readonly conversation: AdminAiChatConversation
  readonly messages: readonly AdminAiChatMessage[]
}
export type AdminAiChatApi = {
  readonly getAiChatConversation: (
    conversationId: string
  ) => Promise<AdminApiResult<AdminAiChatConversationDetail>>
  readonly getAiChatConversations: () => Promise<
    AdminApiResult<AdminAiChatConversationList>
  >
}

export function createAdminAiChatApi(
  transport: AdminHttpTransport
): AdminAiChatApi {
  return {
    async getAiChatConversation(conversationId) {
      const result = await transport.requestJson({
        method: "GET",
        path: `/ai-chat/conversations/${conversationId}`,
        schema: adminAiChatConversationDetailDtoSchema,
      })
      return result.status === "error"
        ? result
        : {
            status: "ok",
            value: {
              conversation: toConversation(result.value.conversation),
              messages: result.value.messages.map((message) => ({
                ...message,
              })),
            },
          }
    },
    async getAiChatConversations() {
      const result = await transport.requestJson({
        method: "GET",
        path: "/ai-chat/conversations",
        schema: adminAiChatConversationListDtoSchema,
      })
      return result.status === "error"
        ? result
        : {
            status: "ok",
            value: { items: result.value.items.map(toConversation) },
          }
    },
  }
}

function toConversation(
  dto: AdminAiChatConversationDto
): AdminAiChatConversation {
  return { ...dto }
}

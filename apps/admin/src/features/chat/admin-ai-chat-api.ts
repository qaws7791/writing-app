import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import {
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
  type AdminAiChatConversationDetailDto,
  type AdminAiChatConversationListDto,
  type AdminAiChatConversationDto,
  type AdminAiChatMessageDto,
  type ConversationId,
} from "@workspace/contracts/admin"

export type AdminAiChatMessage = AdminAiChatMessageDto
export type AdminAiChatConversation = AdminAiChatConversationDto
export type AdminAiChatConversationList = AdminAiChatConversationListDto
export type AdminAiChatConversationDetail = AdminAiChatConversationDetailDto
export type AdminAiChatApi = {
  readonly getAiChatConversation: (
    conversationId: ConversationId
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
      return transport.requestJson({
        method: "GET",
        path: `/ai-chat/conversations/${conversationId}`,
        schema: adminAiChatConversationDetailDtoSchema,
      })
    },
    async getAiChatConversations() {
      return transport.requestJson({
        method: "GET",
        path: "/ai-chat/conversations",
        schema: adminAiChatConversationListDtoSchema,
      })
    },
  }
}

import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"
import type { AdminApiResult } from "@/shared/http/admin-api-result"
import {
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
} from "@workspace/contracts/operations/admin-ai-chat"
import type { ConversationId } from "@/features/ai-chat/model/conversation-id"
import type {
  AdminAiChatConversationDetail,
  AdminAiChatConversationList,
} from "@/features/ai-chat/model/admin-ai-chat"

export type AdminAiChatDal = {
  readonly getAiChatConversation: (
    conversationId: ConversationId
  ) => Promise<AdminApiResult<AdminAiChatConversationDetail>>
  readonly getAiChatConversations: () => Promise<
    AdminApiResult<AdminAiChatConversationList>
  >
}

export function createAdminAiChatDal(
  transport: AdminHttpTransport
): AdminAiChatDal {
  return {
    async getAiChatConversation(conversationId) {
      return transport.requestJson({
        method: "GET",
        path: `/api/admin/ai-chat/conversations/${conversationId}`,
        schema: adminAiChatConversationDetailDtoSchema,
      })
    },
    async getAiChatConversations() {
      return transport.requestJson({
        method: "GET",
        path: "/api/admin/ai-chat/conversations",
        schema: adminAiChatConversationListDtoSchema,
      })
    },
  }
}

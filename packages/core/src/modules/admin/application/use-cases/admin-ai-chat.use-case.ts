import {
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
  adminAiChatMessageDtoSchema,
  type AdminAiChatConversationDetailDto,
  type AdminAiChatConversationListDto,
  type AdminAiChatMessageDto,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  AiChatAdminRepository,
  CreateAdminAiChatUserMessageInput,
  ReadAdminAiChatConversationInput,
  ReadAdminAiChatConversationsInput,
  SaveAdminAiChatAssistantMessageInput,
} from "@workspace/core/modules/admin/application/ports/admin.repository"

export type AdminAiChatUseCase = {
  readonly createAiChatUserMessage: (
    input: CreateAdminAiChatUserMessageInput
  ) => Promise<AdminAiChatConversationDetailDto | null>
  readonly getAiChatConversation: (
    input: ReadAdminAiChatConversationInput
  ) => Promise<AdminAiChatConversationDetailDto | null>
  readonly getAiChatConversations: (
    input: ReadAdminAiChatConversationsInput
  ) => Promise<AdminAiChatConversationListDto>
  readonly saveAiChatAssistantMessage: (
    input: SaveAdminAiChatAssistantMessageInput
  ) => Promise<AdminAiChatMessageDto>
}

export function createAdminAiChatUseCase(
  aiChatRepository: AiChatAdminRepository
): AdminAiChatUseCase {
  return {
    async createAiChatUserMessage(input) {
      return adminAiChatConversationDetailDtoSchema
        .nullable()
        .parse(await aiChatRepository.createAiChatUserMessage(input))
    },
    async getAiChatConversation(input) {
      return adminAiChatConversationDetailDtoSchema
        .nullable()
        .parse(await aiChatRepository.readAiChatConversation(input))
    },
    async getAiChatConversations(input) {
      return adminAiChatConversationListDtoSchema.parse(
        await aiChatRepository.readAiChatConversations(input)
      )
    },
    async saveAiChatAssistantMessage(input) {
      return adminAiChatMessageDtoSchema.parse(
        await aiChatRepository.saveAiChatAssistantMessage(input)
      )
    },
  }
}

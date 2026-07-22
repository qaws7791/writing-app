import { z } from "zod"
import {
  conversationIdSchema,
  messageIdSchema,
} from "#contracts/identity/admin-ids"

export const adminAiChatMessageRoleSchema = z.enum(["assistant", "user"])

export const adminAiChatMessageDtoSchema = z.object({
  content: z.string(),
  createdAt: z.string(),
  id: messageIdSchema,
  role: adminAiChatMessageRoleSchema,
})

export const adminAiChatConversationDtoSchema = z.object({
  createdAt: z.string(),
  id: conversationIdSchema,
  messageCount: z.number().int().nonnegative(),
  title: z.string(),
  updatedAt: z.string(),
})

export const adminAiChatConversationListDtoSchema = z.object({
  items: z.array(adminAiChatConversationDtoSchema),
})

export const adminAiChatConversationDetailDtoSchema = z.object({
  conversation: adminAiChatConversationDtoSchema,
  messages: z.array(adminAiChatMessageDtoSchema),
})

export const adminAiChatMessageRequestSchema = z.object({
  conversationId: conversationIdSchema.optional(),
  message: z.string().trim().min(1).max(4_000),
})

export const adminAiChatStreamChunkEventSchema = z.object({
  delta: z.string(),
})

export const adminAiChatStreamDoneEventSchema = z.object({
  conversation: adminAiChatConversationDtoSchema,
  message: adminAiChatMessageDtoSchema,
})

export const adminAiChatStreamErrorEventSchema = z.object({
  code: z.string(),
  message: z.string(),
})

export const adminAiChatStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    data: adminAiChatStreamChunkEventSchema,
    type: z.literal("chunk"),
  }),
  z.object({
    data: adminAiChatStreamDoneEventSchema,
    type: z.literal("done"),
  }),
  z.object({
    data: adminAiChatStreamErrorEventSchema,
    type: z.literal("error"),
  }),
])

export type AdminAiChatConversationDetailDto = z.infer<
  typeof adminAiChatConversationDetailDtoSchema
>
export type AdminAiChatConversationDto = z.infer<
  typeof adminAiChatConversationDtoSchema
>
export type AdminAiChatConversationListDto = z.infer<
  typeof adminAiChatConversationListDtoSchema
>
export type AdminAiChatMessageDto = z.infer<typeof adminAiChatMessageDtoSchema>
export type AdminAiChatMessageRequest = z.infer<
  typeof adminAiChatMessageRequestSchema
>
export type AdminAiChatMessageRole = z.infer<
  typeof adminAiChatMessageRoleSchema
>
export type AdminAiChatStreamDoneEventDto = z.infer<
  typeof adminAiChatStreamDoneEventSchema
>
export type AdminAiChatStreamEventDto = z.infer<
  typeof adminAiChatStreamEventSchema
>

import { z } from "zod"
import type {
  AdminId,
  ConversationId,
  MessageId,
  UserId,
} from "@workspace/types/ids"

export type {
  AdminId,
  ConversationId,
  MessageId,
  UserId,
} from "@workspace/types/ids"

const identifierSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)

function createIdentifierSchema<TId extends string>() {
  return identifierSchema.transform((value): TId => value as TId)
}

export const adminIdSchema = createIdentifierSchema<AdminId>()
export const conversationIdSchema = createIdentifierSchema<ConversationId>()
export const messageIdSchema = createIdentifierSchema<MessageId>()
export const userIdSchema = createIdentifierSchema<UserId>()

import { z } from "zod"
import type { Brand } from "@workspace/contracts/brand"

export type AdminId = Brand<string, "AdminId">
export type ConversationId = Brand<string, "ConversationId">
export type UserId = Brand<string, "UserId">

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
export const userIdSchema = createIdentifierSchema<UserId>()

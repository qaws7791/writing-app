import type { AdminId, UserId } from "@workspace/types/ids"

import { createIdentifierSchema } from "#contracts/identifier"

export type { AdminId, UserId } from "@workspace/types/ids"

export const adminIdSchema = createIdentifierSchema<AdminId>()
export const userIdSchema = createIdentifierSchema<UserId>()

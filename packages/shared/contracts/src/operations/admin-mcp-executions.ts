import type { AdminMcpExecutionId } from "@workspace/types/ids"

import { createIdentifierSchema } from "#contracts/identifier"
import { z } from "zod"

export type { AdminMcpExecutionId } from "@workspace/types/ids"

export const adminMcpExecutionIdSchema =
  createIdentifierSchema<AdminMcpExecutionId>()

export const adminMcpIdempotencyKeySchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)

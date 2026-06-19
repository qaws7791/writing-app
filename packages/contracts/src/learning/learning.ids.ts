import { z } from "zod"

import type { Brand } from "@workspace/contracts/content/content.ids"

export type LearnerId = Brand<string, "LearnerId">

export const learnerIdSchema = z
  .string()
  .min(1)
  .transform((value) => value as LearnerId)

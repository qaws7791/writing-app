import { z } from "zod"

import { writingSummarySchema } from "../writings/writing-crud-schemas"
import { promptSummarySchema } from "../prompts/prompt-schemas"

export const homeSnapshotSchema = z.object({
  recentWritings: z.array(writingSummarySchema).readonly(),
  resumeWriting: writingSummarySchema.nullable(),
  savedPrompts: z.array(promptSummarySchema).readonly(),
  todayPrompts: z.array(promptSummarySchema).readonly(),
})

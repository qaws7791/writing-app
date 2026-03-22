import { z } from "zod"

import { draftSummarySchema } from "../drafts/draft-schemas"
import { promptSummarySchema } from "../prompts/prompt-schemas"

export const homeSnapshotSchema = z.object({
  recentDrafts: z.array(draftSummarySchema).readonly(),
  resumeDraft: draftSummarySchema.nullable(),
  savedPrompts: z.array(promptSummarySchema).readonly(),
  todayPrompts: z.array(promptSummarySchema).readonly(),
})

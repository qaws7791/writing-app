import { z } from "zod"

import { promptSummarySchema } from "../prompts/prompt-schemas"

export const activeJourneySummarySchema = z.object({
  journeyId: z.number().int(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string().nullable(),
  completionRate: z.number(),
  currentSessionOrder: z.number().int(),
})

export const homeSnapshotSchema = z.object({
  dailyPrompt: promptSummarySchema.nullable(),
  activeJourneys: z.array(activeJourneySummarySchema),
  completedJourneys: z.array(activeJourneySummarySchema),
})

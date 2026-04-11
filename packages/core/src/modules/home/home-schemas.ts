import { z } from "zod"

export const activeJourneySummarySchema = z.object({
  journeyId: z.number().int(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string().nullable(),
  completionRate: z.number(),
  currentSessionOrder: z.number().int(),
})

export const homeSnapshotSchema = z.object({
  activeJourneys: z.array(activeJourneySummarySchema),
  showStartJourneyCta: z.boolean(),
  showWritingSuggestion: z.boolean(),
})

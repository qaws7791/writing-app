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

export const healthCheckAiStatusSchema = z.object({
  reason: z.string(),
  status: z.enum(["degraded"]),
})

export const healthCheckDatabaseStatusSchema = z.object({
  latencyMs: z.number().int().nonnegative().nullable(),
  status: z.enum(["degraded", "ok"]),
})

export const healthCheckResponseSchema = z.object({
  ai: healthCheckAiStatusSchema,
  db: healthCheckDatabaseStatusSchema,
  sqliteVersion: z.string(),
  status: z.enum(["degraded", "ok"]),
})

import { z } from "zod"

export const homeStartActionSchema = z.object({
  id: z.enum(["photo", "garden", "manual"]),
  title: z.string(),
  description: z.string(),
  href: z.string(),
})

export const recentWorkSummarySchema = z.object({
  sceneId: z.string(),
  title: z.string(),
  updatedAt: z.string(),
})

export const gardenSummarySchema = z.object({
  cardCount: z.number().int(),
  sentenceCount: z.number().int(),
})

export const homeSnapshotSchema = z.object({
  startActions: z.array(homeStartActionSchema),
  recentWork: recentWorkSummarySchema.nullable(),
  garden: gardenSummarySchema,
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

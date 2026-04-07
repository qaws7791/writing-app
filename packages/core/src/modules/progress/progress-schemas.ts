import { z } from "zod"

export const journeyProgressStatusSchema = z.enum(["in_progress", "completed"])
export const sessionProgressStatusSchema = z.enum([
  "locked",
  "in_progress",
  "completed",
])

export const userJourneyProgressSchema = z.object({
  userId: z.string(),
  journeyId: z.number().int(),
  currentSessionOrder: z.number().int(),
  completionRate: z.number(),
  status: journeyProgressStatusSchema,
})

export const userSessionProgressSchema = z.object({
  userId: z.string(),
  sessionId: z.number().int(),
  currentStepOrder: z.number().int(),
  status: sessionProgressStatusSchema,
  stepResponsesJson: z.record(z.string(), z.unknown()),
})

export const submitStepBodySchema = z.object({
  response: z.unknown(),
})

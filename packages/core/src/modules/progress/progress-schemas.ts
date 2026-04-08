import { z } from "zod"
import {
  revisionComparisonSchema,
  writingFeedbackSchema,
} from "../ai-feedback/ai-feedback-schemas"
import { journeySessionDetailSchema } from "../journeys/journey-schemas"

export const journeyProgressStatusSchema = z.enum(["in_progress", "completed"])
export const sessionProgressStatusSchema = z.enum([
  "locked",
  "in_progress",
  "completed",
])
export const sessionAiStateStatusSchema = z.enum([
  "pending",
  "succeeded",
  "failed",
])
export const sessionAiStateKindSchema = z.enum(["feedback", "comparison"])

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

export const sessionAiResultSchema = z
  .union([writingFeedbackSchema, revisionComparisonSchema])
  .nullable()

export const sessionStepAiStateSchema = z.object({
  stepOrder: z.number().int().min(1),
  kind: sessionAiStateKindSchema,
  sourceStepOrder: z.number().int().min(1),
  status: sessionAiStateStatusSchema,
  attemptCount: z.number().int().min(0),
  resultJson: sessionAiResultSchema,
  errorMessage: z.string().nullable(),
  updatedAt: z.string(),
})

export const sessionRuntimeSchema = journeySessionDetailSchema.unwrap().extend({
  currentStepOrder: z.number().int().min(1),
  status: sessionProgressStatusSchema,
  stepResponsesJson: z.record(z.string(), z.unknown()),
  stepAiStates: z.array(sessionStepAiStateSchema),
})

export const submitStepBodySchema = z.object({
  response: z.unknown(),
})

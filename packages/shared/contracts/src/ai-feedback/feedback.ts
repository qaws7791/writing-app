import { z } from "zod"

import { lessonIdSchema, lessonStepIdSchema } from "#contracts/content/ids"

export const aiFeedbackIdempotencyKeySchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/)

const aiFeedbackOutputTextMaxLength = 4_000
const aiFeedbackOutputCollectionMaxLength = 20
const nonEmptyTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(aiFeedbackOutputTextMaxLength)

export const aiFeedbackPayloadSchema = z.strictObject({
  improvements: z
    .array(nonEmptyTextSchema)
    .min(1)
    .max(aiFeedbackOutputCollectionMaxLength),
  nextAction: nonEmptyTextSchema,
  strengths: z
    .array(nonEmptyTextSchema)
    .min(1)
    .max(aiFeedbackOutputCollectionMaxLength),
  summary: nonEmptyTextSchema,
})

export const aiFeedbackResultDtoSchema = aiFeedbackPayloadSchema.extend({
  remainingAttempts: z.number().int().nonnegative(),
})

export const createAiFeedbackParamsSchema = z.strictObject({
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

export const createAiFeedbackHeadersSchema = z.looseObject({
  "idempotency-key": aiFeedbackIdempotencyKeySchema,
})

export const aiFeedbackPublicErrorCodeValues = [
  "AI_FEEDBACK_DAILY_QUOTA_EXCEEDED",
  "ATTEMPT_IN_PROGRESS",
  "ATTEMPT_LIMIT_EXCEEDED",
  "PROVIDER_UNAVAILABLE",
] as const

export const aiFeedbackPublicErrorCodeSchema = z.enum(
  aiFeedbackPublicErrorCodeValues
)

export type AiFeedbackPayload = z.infer<typeof aiFeedbackPayloadSchema>
export type AiFeedbackResultDto = z.infer<typeof aiFeedbackResultDtoSchema>
export type AiFeedbackPublicErrorCode = z.infer<
  typeof aiFeedbackPublicErrorCodeSchema
>

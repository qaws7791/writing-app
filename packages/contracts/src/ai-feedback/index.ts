import { z } from "zod"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/content.ids"
import { learnerIdSchema } from "@workspace/contracts/learning/learning.ids"

export const aiFeedbackAnswerMaxLength = 20_000
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
  score: z.number().int().nonnegative(),
  scoreRange: z
    .tuple([z.number().int().nonnegative(), z.number().int().positive()])
    .refine(([min, max]) => min < max, {
      message: "scoreRange는 최소값이 최대값보다 작아야 합니다.",
    }),
  showScore: z.boolean(),
  strengths: z
    .array(nonEmptyTextSchema)
    .min(1)
    .max(aiFeedbackOutputCollectionMaxLength),
  summary: nonEmptyTextSchema,
})

export const aiFeedbackResultDtoSchema = aiFeedbackPayloadSchema.extend({
  remainingAttempts: z.number().int().nonnegative(),
})

export const createAiFeedbackCommandSchema = z.strictObject({
  answer: z.string().trim().min(1).max(aiFeedbackAnswerMaxLength),
  idempotencyKey: aiFeedbackIdempotencyKeySchema,
  lessonId: lessonIdSchema,
  occurredAt: z.date(),
  stepId: lessonStepIdSchema,
  userId: learnerIdSchema,
})

export const createAiFeedbackRequestCommandSchema =
  createAiFeedbackCommandSchema.omit({ answer: true })

export type AiFeedbackPayload = z.infer<typeof aiFeedbackPayloadSchema>
export type AiFeedbackResultDto = z.infer<typeof aiFeedbackResultDtoSchema>
export type CreateAiFeedbackCommand = z.infer<
  typeof createAiFeedbackCommandSchema
>
export type CreateAiFeedbackRequestCommand = z.infer<
  typeof createAiFeedbackRequestCommandSchema
>

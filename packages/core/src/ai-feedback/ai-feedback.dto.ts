import { z } from "zod"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/core/content/content.ids"
import { learnerIdSchema } from "@workspace/core/learning/learning.ids"

const nonEmptyTextSchema = z.string().trim().min(1)

export const aiFeedbackPayloadSchema = z.object({
  improvements: z.array(nonEmptyTextSchema).min(1),
  nextAction: nonEmptyTextSchema,
  score: z.number().int().nonnegative(),
  scoreRange: z
    .tuple([z.number().int().nonnegative(), z.number().int().positive()])
    .refine(([min, max]) => min < max, {
      message: "scoreRange는 최소값이 최대값보다 작아야 합니다.",
    }),
  showScore: z.boolean(),
  strengths: z.array(nonEmptyTextSchema).min(1),
  summary: nonEmptyTextSchema,
})

export const aiFeedbackResultDtoSchema = aiFeedbackPayloadSchema.extend({
  remainingAttempts: z.number().int().nonnegative(),
})

export const createAiFeedbackCommandSchema = z.object({
  answer: nonEmptyTextSchema,
  lessonId: lessonIdSchema,
  occurredAt: z.date(),
  stepId: lessonStepIdSchema,
  userId: learnerIdSchema,
})

export type AiFeedbackPayload = z.infer<typeof aiFeedbackPayloadSchema>
export type AiFeedbackResultDto = z.infer<typeof aiFeedbackResultDtoSchema>
export type CreateAiFeedbackCommand = z.infer<
  typeof createAiFeedbackCommandSchema
>

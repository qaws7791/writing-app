import { z } from "zod"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/core/content/content.ids"
import { learnerIdSchema } from "@workspace/core/learning/learning.ids"

export type JsonPrimitive = string | number | boolean | null
export type JsonArray = readonly JsonValue[]
export type JsonObject = {
  readonly [key: string]: JsonValue
}
export type JsonValue = JsonPrimitive | JsonArray | JsonObject

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ])
)

export const saveStepAnswerCommandSchema = z.object({
  answer: jsonValueSchema,
  lessonId: lessonIdSchema,
  occurredAt: z.date(),
  stepId: lessonStepIdSchema,
  userId: learnerIdSchema,
})

export const saveLessonProgressCommandSchema = z.object({
  currentStepIndex: z.number().int().nonnegative(),
  lessonId: lessonIdSchema,
  occurredAt: z.date(),
  userId: learnerIdSchema,
})

export const completeLessonCommandSchema = saveLessonProgressCommandSchema

export type SaveStepAnswerCommand = z.infer<typeof saveStepAnswerCommandSchema>
export type SaveLessonProgressCommand = z.infer<
  typeof saveLessonProgressCommandSchema
>
export type CompleteLessonCommand = z.infer<typeof completeLessonCommandSchema>

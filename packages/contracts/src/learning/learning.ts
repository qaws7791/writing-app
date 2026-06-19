import { z } from "zod"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/content.ids"
import { learnerIdSchema } from "@workspace/contracts/learning/learning.ids"

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

export const lessonStartedAnswerSchema = z.object({
  kind: z.literal("lesson-started"),
})

export const lessonStepAnswerSchema = z.discriminatedUnion("type", [
  z.object({
    selectedOptionId: z.string(),
    type: z.literal("MULTIPLE_CHOICE"),
  }),
  z.object({
    selectedWords: z.array(z.string()).min(1),
    type: z.literal("FILL_BLANK"),
  }),
  z.object({
    selectedIndexes: z.array(z.number().int().nonnegative()).min(1),
    type: z.literal("SELECT"),
  }),
  z.object({
    orderedItems: z.array(z.string()).min(1),
    type: z.literal("ORDER"),
  }),
  z.object({
    pairs: z
      .array(
        z.object({
          left: z.string(),
          right: z.string(),
        })
      )
      .min(1),
    type: z.literal("MATCH"),
  }),
  z.object({
    items: z
      .array(
        z.object({
          categoryId: z.string(),
          itemId: z.string(),
        })
      )
      .min(1),
    type: z.literal("CATEGORIZE"),
  }),
  z.object({
    text: z.string(),
    type: z.literal("WRITE"),
  }),
  z.object({
    requested: z.literal(true),
    type: z.literal("AI_FEEDBACK"),
  }),
])

export const learningAnswerSchema = z.union([
  lessonStartedAnswerSchema,
  lessonStepAnswerSchema,
])

export const saveStepAnswerCommandSchema = z.object({
  answer: learningAnswerSchema,
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
export type LessonStartedAnswer = z.infer<typeof lessonStartedAnswerSchema>
export type LessonStepAnswer = z.infer<typeof lessonStepAnswerSchema>
export type LearningAnswer = z.infer<typeof learningAnswerSchema>
export type SaveLessonProgressCommand = z.infer<
  typeof saveLessonProgressCommandSchema
>
export type CompleteLessonCommand = z.infer<typeof completeLessonCommandSchema>

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

export const learningAnswerTextMaxLength = 20_000
export const learningAnswerCollectionMaxLength = 100

const learningAnswerTokenSchema = z.string().max(1_000)

export const jsonValueSchema = z.custom<JsonValue>(isBoundedJsonValue, {
  message: "JSON 값이 허용된 깊이 또는 크기를 초과했습니다.",
})

export const lessonStartedAnswerSchema = z.object({
  kind: z.literal("lesson-started"),
})

export const lessonStepAnswerSchema = z.discriminatedUnion("type", [
  z.object({
    selectedOptionId: learningAnswerTokenSchema,
    type: z.literal("MULTIPLE_CHOICE"),
  }),
  z.object({
    selectedWords: z
      .array(learningAnswerTokenSchema)
      .min(1)
      .max(learningAnswerCollectionMaxLength),
    type: z.literal("FILL_BLANK"),
  }),
  z.object({
    selectedIndexes: z
      .array(z.number().int().nonnegative())
      .min(1)
      .max(learningAnswerCollectionMaxLength),
    type: z.literal("SELECT"),
  }),
  z.object({
    orderedItems: z
      .array(learningAnswerTokenSchema)
      .min(1)
      .max(learningAnswerCollectionMaxLength),
    type: z.literal("ORDER"),
  }),
  z.object({
    pairs: z
      .array(
        z.object({
          left: learningAnswerTokenSchema,
          right: learningAnswerTokenSchema,
        })
      )
      .min(1)
      .max(learningAnswerCollectionMaxLength),
    type: z.literal("MATCH"),
  }),
  z.object({
    items: z
      .array(
        z.object({
          categoryId: learningAnswerTokenSchema,
          itemId: learningAnswerTokenSchema,
        })
      )
      .min(1)
      .max(learningAnswerCollectionMaxLength),
    type: z.literal("CATEGORIZE"),
  }),
  z.object({
    text: z.string().max(learningAnswerTextMaxLength),
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

export const completeLessonCommandSchema = z.object({
  lessonId: lessonIdSchema,
  occurredAt: z.date(),
  userId: learnerIdSchema,
})

export const completeLessonRecordSchema = completeLessonCommandSchema.extend({
  currentStepIndex: z.number().int().nonnegative(),
})

export type SaveStepAnswerCommand = z.infer<typeof saveStepAnswerCommandSchema>
export type LessonStartedAnswer = z.infer<typeof lessonStartedAnswerSchema>
export type LessonStepAnswer = z.infer<typeof lessonStepAnswerSchema>
export type LearningAnswer = z.infer<typeof learningAnswerSchema>
export type SaveLessonProgressCommand = z.infer<
  typeof saveLessonProgressCommandSchema
>
export type CompleteLessonCommand = z.infer<typeof completeLessonCommandSchema>
export type CompleteLessonRecord = z.infer<typeof completeLessonRecordSchema>

function isBoundedJsonValue(value: unknown): value is JsonValue {
  const pending: Array<{ readonly depth: number; readonly value: unknown }> = [
    { depth: 0, value },
  ]
  let visitedNodeCount = 0

  while (pending.length > 0) {
    const current = pending.pop()

    if (current === undefined) {
      break
    }

    visitedNodeCount += 1

    if (current.depth > 16 || visitedNodeCount > 1_000) {
      return false
    }

    if (
      current.value === null ||
      typeof current.value === "boolean" ||
      (typeof current.value === "number" && Number.isFinite(current.value))
    ) {
      continue
    }

    if (typeof current.value === "string") {
      if (current.value.length > learningAnswerTextMaxLength) {
        return false
      }

      continue
    }

    if (Array.isArray(current.value)) {
      if (current.value.length > learningAnswerCollectionMaxLength) {
        return false
      }

      for (const item of current.value) {
        pending.push({ depth: current.depth + 1, value: item })
      }

      continue
    }

    if (typeof current.value !== "object") {
      return false
    }

    const prototype = Object.getPrototypeOf(current.value)

    if (prototype !== Object.prototype && prototype !== null) {
      return false
    }

    const entries = Object.entries(current.value)

    if (entries.length > learningAnswerCollectionMaxLength) {
      return false
    }

    for (const [key, entryValue] of entries) {
      if (key.length > 1_000) {
        return false
      }

      pending.push({ depth: current.depth + 1, value: entryValue })
    }
  }

  return true
}

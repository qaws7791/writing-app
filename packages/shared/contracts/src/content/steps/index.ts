import { z } from "zod"

import { aiFeedbackStepDtoSchema } from "#contracts/content/steps/ai-feedback-step.dto"
import { categorizeStepDtoSchema } from "#contracts/content/steps/categorize-step.dto"
import { compareStepDtoSchema } from "#contracts/content/steps/compare-step.dto"
import { fillBlankStepDtoSchema } from "#contracts/content/steps/fill-blank-step.dto"
import { matchStepDtoSchema } from "#contracts/content/steps/match-step.dto"
import { multipleChoiceStepDtoSchema } from "#contracts/content/steps/multiple-choice-step.dto"
import { orderStepDtoSchema } from "#contracts/content/steps/order-step.dto"
import { readingStepDtoSchema } from "#contracts/content/steps/reading-step.dto"
import { selectStepDtoSchema } from "#contracts/content/steps/select-step.dto"
import { writeStepDtoSchema } from "#contracts/content/steps/write-step.dto"

export const lessonStepTypeValues = [
  "READING",
  "COMPARE",
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "SELECT",
  "ORDER",
  "WRITE",
  "AI_FEEDBACK",
  "MATCH",
  "CATEGORIZE",
] as const

export const lessonStepTypeSchema = z.enum(lessonStepTypeValues)
export type LessonStepType = z.infer<typeof lessonStepTypeSchema>

type LessonStepDefinition = {
  readonly answerable: boolean
  readonly schema: z.ZodType<unknown>
}

export const lessonStepDefinitions = {
  READING: {
    answerable: false,
    schema: readingStepDtoSchema,
  },
  COMPARE: {
    answerable: false,
    schema: compareStepDtoSchema,
  },
  MULTIPLE_CHOICE: {
    answerable: true,
    schema: multipleChoiceStepDtoSchema,
  },
  FILL_BLANK: {
    answerable: true,
    schema: fillBlankStepDtoSchema,
  },
  SELECT: {
    answerable: true,
    schema: selectStepDtoSchema,
  },
  ORDER: {
    answerable: true,
    schema: orderStepDtoSchema,
  },
  WRITE: {
    answerable: true,
    schema: writeStepDtoSchema,
  },
  AI_FEEDBACK: {
    answerable: true,
    schema: aiFeedbackStepDtoSchema,
  },
  MATCH: {
    answerable: true,
    schema: matchStepDtoSchema,
  },
  CATEGORIZE: {
    answerable: true,
    schema: categorizeStepDtoSchema,
  },
} as const satisfies Record<LessonStepType, LessonStepDefinition>

export const lessonStepDtoSchema = z.discriminatedUnion("type", [
  lessonStepDefinitions.READING.schema,
  lessonStepDefinitions.COMPARE.schema,
  lessonStepDefinitions.MULTIPLE_CHOICE.schema,
  lessonStepDefinitions.FILL_BLANK.schema,
  lessonStepDefinitions.SELECT.schema,
  lessonStepDefinitions.ORDER.schema,
  lessonStepDefinitions.WRITE.schema,
  lessonStepDefinitions.AI_FEEDBACK.schema,
  lessonStepDefinitions.MATCH.schema,
  lessonStepDefinitions.CATEGORIZE.schema,
])

export type LessonStepDto = z.infer<typeof lessonStepDtoSchema>

export const answerableLessonStepTypeValues = lessonStepTypeValues.filter(
  (stepType) => lessonStepDefinitions[stepType].answerable
)

export const answerableLessonStepTypes = new Set<LessonStepType>(
  answerableLessonStepTypeValues
)

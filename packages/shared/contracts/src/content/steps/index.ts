import { z } from "zod"

import { categorizeStepDtoSchema } from "#contracts/content/steps/categorize-step.dto"
import { compareStepDtoSchema } from "#contracts/content/steps/compare-step.dto"
import { errorCorrectStepDtoSchema } from "#contracts/content/steps/error-correct-step.dto"
import { fillBlankStepDtoSchema } from "#contracts/content/steps/fill-blank-step.dto"
import { matchStepDtoSchema } from "#contracts/content/steps/match-step.dto"
import { multipleChoiceStepDtoSchema } from "#contracts/content/steps/multiple-choice-step.dto"
import { orderStepDtoSchema } from "#contracts/content/steps/order-step.dto"
import { readingStepDtoSchema } from "#contracts/content/steps/reading-step.dto"
import { selectStepDtoSchema } from "#contracts/content/steps/select-step.dto"
import { sentenceBuildStepDtoSchema } from "#contracts/content/steps/sentence-build-step.dto"
import { trueFalseStepDtoSchema } from "#contracts/content/steps/true-false-step.dto"

export const lessonStepTypeValues = [
  "READING",
  "COMPARE",
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "SELECT",
  "ORDER",
  "MATCH",
  "CATEGORIZE",
  "TRUE_FALSE",
  "SENTENCE_BUILD",
  "ERROR_CORRECT",
] as const

export const lessonStepTypeSchema = z.enum(lessonStepTypeValues)
export type LessonStepType = z.infer<typeof lessonStepTypeSchema>

type LessonStepDefinition = {
  readonly answerable: boolean
  readonly completion: "acknowledge" | "answer"
  readonly draftable: boolean
  readonly evaluatedByServer: boolean
  readonly schema: z.ZodType<unknown>
}

export const lessonStepDefinitions = {
  READING: {
    answerable: false,
    completion: "acknowledge",
    draftable: false,
    evaluatedByServer: false,
    schema: readingStepDtoSchema,
  },
  COMPARE: {
    answerable: false,
    completion: "acknowledge",
    draftable: false,
    evaluatedByServer: false,
    schema: compareStepDtoSchema,
  },
  MULTIPLE_CHOICE: {
    answerable: true,
    completion: "answer",
    draftable: true,
    evaluatedByServer: true,
    schema: multipleChoiceStepDtoSchema,
  },
  FILL_BLANK: {
    answerable: true,
    completion: "answer",
    draftable: true,
    evaluatedByServer: true,
    schema: fillBlankStepDtoSchema,
  },
  SELECT: {
    answerable: true,
    completion: "answer",
    draftable: true,
    evaluatedByServer: true,
    schema: selectStepDtoSchema,
  },
  ORDER: {
    answerable: true,
    completion: "answer",
    draftable: true,
    evaluatedByServer: true,
    schema: orderStepDtoSchema,
  },
  MATCH: {
    answerable: true,
    completion: "answer",
    draftable: true,
    evaluatedByServer: true,
    schema: matchStepDtoSchema,
  },
  CATEGORIZE: {
    answerable: true,
    completion: "answer",
    draftable: true,
    evaluatedByServer: true,
    schema: categorizeStepDtoSchema,
  },
  TRUE_FALSE: {
    answerable: true,
    completion: "answer",
    draftable: true,
    evaluatedByServer: true,
    schema: trueFalseStepDtoSchema,
  },
  SENTENCE_BUILD: {
    answerable: true,
    completion: "answer",
    draftable: true,
    evaluatedByServer: true,
    schema: sentenceBuildStepDtoSchema,
  },
  ERROR_CORRECT: {
    answerable: true,
    completion: "answer",
    draftable: true,
    evaluatedByServer: true,
    schema: errorCorrectStepDtoSchema,
  },
} as const satisfies Record<LessonStepType, LessonStepDefinition>

export const lessonStepDtoSchema = z.discriminatedUnion("type", [
  lessonStepDefinitions.READING.schema,
  lessonStepDefinitions.COMPARE.schema,
  lessonStepDefinitions.MULTIPLE_CHOICE.schema,
  lessonStepDefinitions.FILL_BLANK.schema,
  lessonStepDefinitions.SELECT.schema,
  lessonStepDefinitions.ORDER.schema,
  lessonStepDefinitions.MATCH.schema,
  lessonStepDefinitions.CATEGORIZE.schema,
  lessonStepDefinitions.TRUE_FALSE.schema,
  lessonStepDefinitions.SENTENCE_BUILD.schema,
  lessonStepDefinitions.ERROR_CORRECT.schema,
])

export type LessonStepDto = z.infer<typeof lessonStepDtoSchema>

export type AnswerableLessonStepType = {
  [TType in LessonStepType]: (typeof lessonStepDefinitions)[TType]["answerable"] extends true
    ? TType
    : never
}[LessonStepType]

export const answerableLessonStepTypeValues = lessonStepTypeValues.filter(
  (stepType): stepType is AnswerableLessonStepType =>
    lessonStepDefinitions[stepType].answerable
)

export const answerableLessonStepTypes = new Set<LessonStepType>(
  answerableLessonStepTypeValues
)

export const draftableLessonStepTypeValues = lessonStepTypeValues.filter(
  (stepType): stepType is AnswerableLessonStepType =>
    lessonStepDefinitions[stepType].draftable
)

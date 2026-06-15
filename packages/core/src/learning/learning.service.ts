import type { ContentRepository, LessonStepType } from "@workspace/core/content"
import { lessonDtoSchema } from "@workspace/core/content"
import {
  completeLessonCommandSchema,
  lessonStartedAnswerSchema,
  lessonStepAnswerSchema,
  saveLessonProgressCommandSchema,
  saveStepAnswerCommandSchema,
  type CompleteLessonCommand,
  type SaveLessonProgressCommand,
  type SaveStepAnswerCommand,
} from "@workspace/core/learning/learning.dto"
import type { LearningRepository } from "@workspace/core/learning/learning.repository"
import { err, ok, type Result } from "@workspace/core/result"
import type { z } from "zod"

const answerableStepTypes = new Set<LessonStepType>([
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "SELECT",
  "ORDER",
  "MATCH",
  "CATEGORIZE",
  "WRITE",
  "AI_FEEDBACK",
])

export type LearningServiceError =
  | {
      readonly kind: "lesson-not-found"
      readonly lessonId: SaveStepAnswerCommand["lessonId"]
    }
  | {
      readonly kind: "invalid-request"
      readonly reason:
        | "step-answer-invalid"
        | "step-answer-not-supported"
        | "step-answer-shape-invalid"
        | "step-not-found-in-lesson"
      readonly stepId: SaveStepAnswerCommand["stepId"]
    }

export type LearningMutationResult = {
  readonly saved: true
}

export type LearningService = {
  readonly completeLesson: (
    command: CompleteLessonCommand
  ) => Promise<Result<LearningMutationResult, LearningServiceError>>
  readonly saveLessonProgress: (
    command: SaveLessonProgressCommand
  ) => Promise<Result<LearningMutationResult, LearningServiceError>>
  readonly saveStepAnswer: (
    command: SaveStepAnswerCommand
  ) => Promise<Result<LearningMutationResult, LearningServiceError>>
}

export function createLearningService({
  contentRepository,
  learningRepository,
}: {
  readonly contentRepository: ContentRepository
  readonly learningRepository: LearningRepository
}): LearningService {
  return {
    async completeLesson(command) {
      const parsedCommand = completeLessonCommandSchema.parse(command)
      const lesson = await contentRepository.findLesson(parsedCommand.lessonId)

      if (lesson === null) {
        return err({
          kind: "lesson-not-found",
          lessonId: parsedCommand.lessonId,
        })
      }

      await learningRepository.completeLesson(parsedCommand)

      return ok({ saved: true })
    },
    async saveLessonProgress(command) {
      const parsedCommand = saveLessonProgressCommandSchema.parse(command)
      const lesson = await contentRepository.findLesson(parsedCommand.lessonId)

      if (lesson === null) {
        return err({
          kind: "lesson-not-found",
          lessonId: parsedCommand.lessonId,
        })
      }

      await learningRepository.saveLessonProgress(parsedCommand)

      return ok({ saved: true })
    },
    async saveStepAnswer(command) {
      const parsedCommand = saveStepAnswerCommandSchema.parse(command)
      const lesson = await contentRepository.findLesson(parsedCommand.lessonId)

      if (lesson === null) {
        return err({
          kind: "lesson-not-found",
          lessonId: parsedCommand.lessonId,
        })
      }

      const parsedLesson = lessonDtoSchema.parse(lesson)
      const step = parsedLesson.steps.find(
        (candidate) => candidate.id === parsedCommand.stepId
      )

      if (step === undefined) {
        return err({
          kind: "invalid-request",
          reason: "step-not-found-in-lesson",
          stepId: parsedCommand.stepId,
        })
      }

      const supportsStepAnswer =
        isLessonStartedAnswer(parsedCommand.answer, {
          firstStepId: parsedLesson.steps[0]?.id,
          stepId: step.id,
        }) || isStepAnswerForStepType(parsedCommand.answer, step.type)

      if (!supportsStepAnswer) {
        return err({
          kind: "invalid-request",
          reason: answerableStepTypes.has(step.type)
            ? "step-answer-shape-invalid"
            : "step-answer-not-supported",
          stepId: parsedCommand.stepId,
        })
      }

      if (
        answerableStepTypes.has(step.type) &&
        !isValidStepAnswer(step, parsedCommand.answer)
      ) {
        return err({
          kind: "invalid-request",
          reason: "step-answer-invalid",
          stepId: parsedCommand.stepId,
        })
      }

      await learningRepository.saveStepAnswer(parsedCommand)

      return ok({ saved: true })
    },
  }
}

export { answerableStepTypes }

type LessonStep = z.infer<typeof lessonDtoSchema>["steps"][number]
type UnknownObject = {
  readonly [key: string]: unknown
}

function isValidStepAnswer(step: LessonStep, answer: unknown): boolean {
  switch (step.type) {
    case "AI_FEEDBACK":
      return readTypedObject(answer, "AI_FEEDBACK")?.["requested"] === true
    case "CATEGORIZE":
      return isValidCategorizeAnswer(step, answer)
    case "FILL_BLANK":
      return isValidFillBlankAnswer(step, answer)
    case "MATCH":
      return isValidMatchAnswer(step, answer)
    case "MULTIPLE_CHOICE":
      return isValidMultipleChoiceAnswer(step, answer)
    case "ORDER":
      return isValidOrderAnswer(step, answer)
    case "SELECT":
      return isValidSelectAnswer(step, answer)
    case "WRITE":
      return isValidWriteAnswer(answer)
    case "COMPARE":
    case "READING":
      return false
  }
}

function isValidMultipleChoiceAnswer(
  step: Extract<LessonStep, { readonly type: "MULTIPLE_CHOICE" }>,
  answer: unknown
): boolean {
  const selectedOptionId = readTypedObject(answer, "MULTIPLE_CHOICE")?.[
    "selectedOptionId"
  ]

  return (
    typeof selectedOptionId === "string" &&
    step.options.some((option) => option.id === selectedOptionId)
  )
}

function isValidFillBlankAnswer(
  step: Extract<LessonStep, { readonly type: "FILL_BLANK" }>,
  answer: unknown
): boolean {
  const selectedWords = readStringArray(
    readTypedObject(answer, "FILL_BLANK")?.["selectedWords"]
  )

  return (
    selectedWords !== null &&
    selectedWords.length === step.answer.length &&
    selectedWords.every((word) => step.words.includes(word))
  )
}

function isValidSelectAnswer(
  step: Extract<LessonStep, { readonly type: "SELECT" }>,
  answer: unknown
): boolean {
  const selectedIndexes = readNumberArray(
    readTypedObject(answer, "SELECT")?.["selectedIndexes"]
  )

  return (
    selectedIndexes !== null &&
    selectedIndexes.length > 0 &&
    hasUniqueValues(selectedIndexes) &&
    selectedIndexes.every(
      (selectedIndex) =>
        Number.isInteger(selectedIndex) &&
        selectedIndex >= 0 &&
        selectedIndex < step.segments.length
    )
  )
}

function isValidOrderAnswer(
  step: Extract<LessonStep, { readonly type: "ORDER" }>,
  answer: unknown
): boolean {
  const orderedItems = readStringArray(
    readTypedObject(answer, "ORDER")?.["orderedItems"]
  )

  return (
    orderedItems !== null &&
    orderedItems.length === step.items.length &&
    hasUniqueValues(orderedItems) &&
    orderedItems.every((item) => step.items.includes(item))
  )
}

function isValidMatchAnswer(
  step: Extract<LessonStep, { readonly type: "MATCH" }>,
  answer: unknown
): boolean {
  const pairs = readObjectArray(readTypedObject(answer, "MATCH")?.["pairs"])
  const leftValues = step.pairs.map((pair) => pair.left)
  const rightValues = step.pairs.map((pair) => pair.right)

  return (
    pairs !== null &&
    pairs.length === step.pairs.length &&
    hasUniqueValues(pairs.map((pair) => pair["left"])) &&
    pairs.every(
      (pair) =>
        typeof pair["left"] === "string" &&
        typeof pair["right"] === "string" &&
        leftValues.includes(pair["left"]) &&
        rightValues.includes(pair["right"])
    )
  )
}

function isValidCategorizeAnswer(
  step: Extract<LessonStep, { readonly type: "CATEGORIZE" }>,
  answer: unknown
): boolean {
  const items = readObjectArray(
    readTypedObject(answer, "CATEGORIZE")?.["items"]
  )
  const itemIds = step.items.map((item) => item.id)
  const categoryIds = step.categories.map((category) => category.id)

  return (
    items !== null &&
    items.length === step.items.length &&
    hasUniqueValues(items.map((item) => item["itemId"])) &&
    items.every(
      (item) =>
        typeof item["itemId"] === "string" &&
        typeof item["categoryId"] === "string" &&
        itemIds.includes(item["itemId"]) &&
        categoryIds.includes(item["categoryId"])
    )
  )
}

function isValidWriteAnswer(answer: unknown): boolean {
  const text =
    typeof answer === "string"
      ? answer
      : readTypedObject(answer, "WRITE")?.["text"]

  return typeof text === "string" && text.trim() !== ""
}

function readTypedObject(answer: unknown, type: string): UnknownObject | null {
  if (
    typeof answer !== "object" ||
    answer === null ||
    !("type" in answer) ||
    answer.type !== type
  ) {
    return null
  }

  return answer as UnknownObject
}

function readStringArray(value: unknown): readonly string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null
}

function readNumberArray(value: unknown): readonly number[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "number")
    ? value
    : null
}

function readObjectArray(value: unknown): readonly UnknownObject[] | null {
  return Array.isArray(value) &&
    value.every((item) => typeof item === "object" && item !== null)
    ? (value as readonly UnknownObject[])
    : null
}

function hasUniqueValues(values: readonly unknown[]): boolean {
  return new Set(values).size === values.length
}

function isLessonStartedAnswer(
  answer: unknown,
  {
    firstStepId,
    stepId,
  }: {
    readonly firstStepId: string | undefined
    readonly stepId: string
  }
): boolean {
  return (
    stepId === firstStepId &&
    lessonStartedAnswerSchema.safeParse(answer).success
  )
}

function isStepAnswerForStepType(
  answer: unknown,
  stepType: LessonStepType
): boolean {
  const parsedAnswer = lessonStepAnswerSchema.safeParse(answer)

  return parsedAnswer.success && parsedAnswer.data.type === stepType
}

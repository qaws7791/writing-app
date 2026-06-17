import type { ContentRepository } from "@workspace/core/content"
import {
  answerableLessonStepTypes,
  lessonDtoSchema,
} from "@workspace/core/content"
import {
  completeLessonCommandSchema,
  lessonStartedAnswerSchema,
  saveLessonProgressCommandSchema,
  saveStepAnswerCommandSchema,
  type CompleteLessonCommand,
  type LearningAnswer,
  type LessonStepAnswer,
  type SaveLessonProgressCommand,
  type SaveStepAnswerCommand,
} from "@workspace/core/learning/learning.dto"
import type { LearningRepository } from "@workspace/core/learning/learning.repository"
import { err, ok, type Result } from "@workspace/core/result"
import type { z } from "zod"

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

      const answer = parsedCommand.answer
      const supportsStepAnswer =
        isLessonStartedAnswer(answer, {
          firstStepId: parsedLesson.steps[0]?.id,
          stepId: step.id,
        }) ||
        (isLessonStepAnswer(answer) && answer.type === step.type)

      if (!supportsStepAnswer) {
        return err({
          kind: "invalid-request",
          reason: answerableLessonStepTypes.has(step.type)
            ? "step-answer-shape-invalid"
            : "step-answer-not-supported",
          stepId: parsedCommand.stepId,
        })
      }

      if (
        answerableLessonStepTypes.has(step.type) &&
        (!isLessonStepAnswer(answer) || !isValidStepAnswer(step, answer))
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

export { answerableLessonStepTypes as answerableStepTypes }

type LessonStep = z.infer<typeof lessonDtoSchema>["steps"][number]

function isValidStepAnswer(
  step: LessonStep,
  answer: LessonStepAnswer
): boolean {
  switch (step.type) {
    case "AI_FEEDBACK":
      return answer.type === "AI_FEEDBACK" && answer.requested === true
    case "CATEGORIZE":
      return (
        answer.type === "CATEGORIZE" && isValidCategorizeAnswer(step, answer)
      )
    case "FILL_BLANK":
      return (
        answer.type === "FILL_BLANK" && isValidFillBlankAnswer(step, answer)
      )
    case "MATCH":
      return answer.type === "MATCH" && isValidMatchAnswer(step, answer)
    case "MULTIPLE_CHOICE":
      return (
        answer.type === "MULTIPLE_CHOICE" &&
        isValidMultipleChoiceAnswer(step, answer)
      )
    case "ORDER":
      return answer.type === "ORDER" && isValidOrderAnswer(step, answer)
    case "SELECT":
      return answer.type === "SELECT" && isValidSelectAnswer(step, answer)
    case "WRITE":
      return answer.type === "WRITE" && isValidWriteAnswer(answer)
    case "COMPARE":
    case "READING":
      return false
  }
}

function isLessonStepAnswer(
  answer: LearningAnswer
): answer is LessonStepAnswer {
  return "type" in answer
}

function isValidMultipleChoiceAnswer(
  step: Extract<LessonStep, { readonly type: "MULTIPLE_CHOICE" }>,
  answer: Extract<LessonStepAnswer, { readonly type: "MULTIPLE_CHOICE" }>
): boolean {
  return step.options.some((option) => option.id === answer.selectedOptionId)
}

function isValidFillBlankAnswer(
  step: Extract<LessonStep, { readonly type: "FILL_BLANK" }>,
  answer: Extract<LessonStepAnswer, { readonly type: "FILL_BLANK" }>
): boolean {
  return (
    answer.selectedWords.length === step.answer.length &&
    answer.selectedWords.every((word) => step.words.includes(word))
  )
}

function isValidSelectAnswer(
  step: Extract<LessonStep, { readonly type: "SELECT" }>,
  answer: Extract<LessonStepAnswer, { readonly type: "SELECT" }>
): boolean {
  return (
    answer.selectedIndexes.length > 0 &&
    hasUniqueValues(answer.selectedIndexes) &&
    answer.selectedIndexes.every(
      (selectedIndex) =>
        Number.isInteger(selectedIndex) &&
        selectedIndex >= 0 &&
        selectedIndex < step.segments.length
    )
  )
}

function isValidOrderAnswer(
  step: Extract<LessonStep, { readonly type: "ORDER" }>,
  answer: Extract<LessonStepAnswer, { readonly type: "ORDER" }>
): boolean {
  return (
    answer.orderedItems.length === step.items.length &&
    hasUniqueValues(answer.orderedItems) &&
    answer.orderedItems.every((item) => step.items.includes(item))
  )
}

function isValidMatchAnswer(
  step: Extract<LessonStep, { readonly type: "MATCH" }>,
  answer: Extract<LessonStepAnswer, { readonly type: "MATCH" }>
): boolean {
  const leftValues = step.pairs.map((pair) => pair.left)
  const rightValues = step.pairs.map((pair) => pair.right)

  return (
    answer.pairs.length === step.pairs.length &&
    hasUniqueValues(answer.pairs.map((pair) => pair.left)) &&
    answer.pairs.every(
      (pair) =>
        leftValues.includes(pair.left) && rightValues.includes(pair.right)
    )
  )
}

function isValidCategorizeAnswer(
  step: Extract<LessonStep, { readonly type: "CATEGORIZE" }>,
  answer: Extract<LessonStepAnswer, { readonly type: "CATEGORIZE" }>
): boolean {
  const itemIds = step.items.map((item) => item.id)
  const categoryIds = step.categories.map((category) => category.id)

  return (
    answer.items.length === step.items.length &&
    hasUniqueValues(answer.items.map((item) => item.itemId)) &&
    answer.items.every(
      (item) =>
        itemIds.includes(item.itemId) && categoryIds.includes(item.categoryId)
    )
  )
}

function isValidWriteAnswer(
  answer: Extract<LessonStepAnswer, { readonly type: "WRITE" }>
): boolean {
  return answer.text.trim() !== ""
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

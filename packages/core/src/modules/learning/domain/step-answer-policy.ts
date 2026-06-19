import type {
  LessonDto,
  LessonStepDto,
} from "@workspace/core/modules/content/domain/content.dto"
import { answerableLessonStepTypes } from "@workspace/core/modules/content/domain/content.dto"
import type { LessonStepId } from "@workspace/core/modules/content/domain/content.ids"
import {
  lessonStartedAnswerSchema,
  type LearningAnswer,
  type LessonStepAnswer,
} from "@workspace/core/modules/learning/domain/learning.dto"

export const answerableStepTypes = answerableLessonStepTypes

export type StepAnswerPolicyRejectionReason =
  | "step-answer-invalid"
  | "step-answer-not-supported"
  | "step-answer-shape-invalid"
  | "step-not-found-in-lesson"

export type StepAnswerPolicyResult =
  | {
      readonly kind: "accepted"
    }
  | {
      readonly kind: "rejected"
      readonly reason: StepAnswerPolicyRejectionReason
      readonly stepId: LessonStepId
    }

export function validateStepAnswerForLesson({
  answer,
  lesson,
  stepId,
}: {
  readonly answer: LearningAnswer
  readonly lesson: LessonDto
  readonly stepId: LessonStepId
}): StepAnswerPolicyResult {
  const step = lesson.steps.find((candidate) => candidate.id === stepId)

  if (step === undefined) {
    return {
      kind: "rejected",
      reason: "step-not-found-in-lesson",
      stepId,
    }
  }

  const supportsStepAnswer =
    isLessonStartedAnswer(answer, {
      firstStepId: lesson.steps[0]?.id,
      stepId: step.id,
    }) ||
    (isLessonStepAnswer(answer) && answer.type === step.type)

  if (!supportsStepAnswer) {
    return {
      kind: "rejected",
      reason: answerableStepTypes.has(step.type)
        ? "step-answer-shape-invalid"
        : "step-answer-not-supported",
      stepId,
    }
  }

  if (
    answerableStepTypes.has(step.type) &&
    (!isLessonStepAnswer(answer) || !isValidStepAnswer(step, answer))
  ) {
    return {
      kind: "rejected",
      reason: "step-answer-invalid",
      stepId,
    }
  }

  return {
    kind: "accepted",
  }
}

function isValidStepAnswer(
  step: LessonStepDto,
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
  step: Extract<LessonStepDto, { readonly type: "MULTIPLE_CHOICE" }>,
  answer: Extract<LessonStepAnswer, { readonly type: "MULTIPLE_CHOICE" }>
): boolean {
  return step.options.some((option) => option.id === answer.selectedOptionId)
}

function isValidFillBlankAnswer(
  step: Extract<LessonStepDto, { readonly type: "FILL_BLANK" }>,
  answer: Extract<LessonStepAnswer, { readonly type: "FILL_BLANK" }>
): boolean {
  return (
    answer.selectedWords.length === step.answer.length &&
    answer.selectedWords.every((word) => step.words.includes(word))
  )
}

function isValidSelectAnswer(
  step: Extract<LessonStepDto, { readonly type: "SELECT" }>,
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
  step: Extract<LessonStepDto, { readonly type: "ORDER" }>,
  answer: Extract<LessonStepAnswer, { readonly type: "ORDER" }>
): boolean {
  return (
    answer.orderedItems.length === step.items.length &&
    hasUniqueValues(answer.orderedItems) &&
    answer.orderedItems.every((item) => step.items.includes(item))
  )
}

function isValidMatchAnswer(
  step: Extract<LessonStepDto, { readonly type: "MATCH" }>,
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
  step: Extract<LessonStepDto, { readonly type: "CATEGORIZE" }>,
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
    readonly firstStepId: LessonStepId | undefined
    readonly stepId: LessonStepId
  }
): boolean {
  return (
    stepId === firstStepId &&
    lessonStartedAnswerSchema.safeParse(answer).success
  )
}

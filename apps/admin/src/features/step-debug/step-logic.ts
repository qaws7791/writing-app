import type { Lesson, LessonStep } from "@/features/step-debug/step-types"

export type LessonStartedAnswer = {
  readonly kind: "lesson-started"
}

export type LessonAnswerChange = {
  readonly answer: LessonStartedAnswer | LessonStepAnswerPayload
  readonly stepId: string
}

export type LessonAiFeedback = {
  readonly improvements: readonly string[]
  readonly nextAction: string
  readonly remainingAttempts: number
  readonly score: number
  readonly scoreRange: readonly [number, number]
  readonly showScore: boolean
  readonly strengths: readonly string[]
  readonly summary: string
}

export type LessonAiFeedbackRequest = {
  readonly answer: string
  readonly stepId: string
}

export type LessonAiFeedbackOutcome =
  | {
      readonly feedback: LessonAiFeedback
      readonly status: "ok"
    }
  | {
      readonly message: string
      readonly status: "error"
    }

export type LessonStepAnswerPayload =
  | {
      readonly selectedOptionId: string
      readonly type: "MULTIPLE_CHOICE"
    }
  | {
      readonly selectedWords: readonly string[]
      readonly type: "FILL_BLANK"
    }
  | {
      readonly selectedIndexes: readonly number[]
      readonly type: "SELECT"
    }
  | {
      readonly orderedItems: readonly string[]
      readonly type: "ORDER"
    }
  | {
      readonly pairs: readonly {
        readonly left: string
        readonly right: string
      }[]
      readonly type: "MATCH"
    }
  | {
      readonly items: readonly {
        readonly categoryId: string
        readonly itemId: string
      }[]
      readonly type: "CATEGORIZE"
    }
  | {
      readonly text: string
      readonly type: "WRITE"
    }

export function getFirstLessonStep(lesson: Lesson): LessonStep | null {
  return getLessonStep(lesson, 0)
}

export function getLessonStep(
  lesson: Lesson,
  stepIndex: number
): LessonStep | null {
  return lesson.steps[stepIndex] ?? null
}

export function isLastLessonStep(lesson: Lesson, stepIndex: number): boolean {
  return stepIndex === lesson.steps.length - 1
}

export function createLessonStartedAnswer(): LessonStartedAnswer {
  return {
    kind: "lesson-started",
  }
}

export function createLessonStepAnswer(
  payload: LessonStepAnswerPayload
): LessonStepAnswerPayload {
  return payload
}

export function isValidLessonStepAnswerPayload(
  step: LessonStep,
  payload: LessonStepAnswerPayload | undefined
): boolean {
  switch (step.type) {
    case "CATEGORIZE":
      return (
        payload?.type === "CATEGORIZE" &&
        payload.items.length === step.items.length &&
        hasUniqueValues(payload.items.map((item) => item.itemId)) &&
        payload.items.every(
          (item) =>
            step.items.some((stepItem) => stepItem.id === item.itemId) &&
            step.categories.some((category) => category.id === item.categoryId)
        )
      )
    case "FILL_BLANK":
      return (
        payload?.type === "FILL_BLANK" &&
        payload.selectedWords.filter(Boolean).length === step.answer.length &&
        payload.selectedWords.every((word) => step.words.includes(word))
      )
    case "MATCH":
      return (
        payload?.type === "MATCH" &&
        payload.pairs.length === step.pairs.length &&
        hasUniqueValues(payload.pairs.map((pair) => pair.left)) &&
        payload.pairs.every(
          (pair) =>
            pair.right !== "" &&
            step.pairs.some((stepPair) => stepPair.left === pair.left) &&
            step.pairs.some((stepPair) => stepPair.right === pair.right)
        )
      )
    case "MULTIPLE_CHOICE":
      return (
        payload?.type === "MULTIPLE_CHOICE" &&
        step.options.some((option) => option.id === payload.selectedOptionId)
      )
    case "ORDER":
      return (
        payload?.type === "ORDER" &&
        payload.orderedItems.length === step.items.length &&
        hasUniqueValues(payload.orderedItems) &&
        payload.orderedItems.every((item) => step.items.includes(item))
      )
    case "SELECT":
      return (
        payload?.type === "SELECT" &&
        payload.selectedIndexes.length > 0 &&
        hasUniqueValues(payload.selectedIndexes) &&
        payload.selectedIndexes.every(
          (selectedIndex) =>
            Number.isInteger(selectedIndex) &&
            selectedIndex >= 0 &&
            selectedIndex < step.segments.length
        )
      )
    case "WRITE":
      return (
        payload?.type === "WRITE" && payload.text.length >= (step.min || 20)
      )
    case "AI_FEEDBACK":
    case "COMPARE":
    case "READING":
      return false
  }
}

export function formatEstimatedMinutes(minutes: number): string {
  return `예상 ${minutes}분`
}

export function formatStepCount(stepCount: number): string {
  return `${stepCount}개 스텝`
}

function hasUniqueValues(values: readonly unknown[]): boolean {
  return new Set(values).size === values.length
}

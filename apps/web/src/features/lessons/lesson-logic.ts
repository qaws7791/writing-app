import type { Lesson, LessonStep } from "@/features/lessons/lesson-types"

export type LessonStartedAnswer = {
  readonly kind: "lesson-started"
}

export type LessonAnswerChange = {
  readonly answer: string
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

export function createLessonStartedAnswer(): string {
  const answer: LessonStartedAnswer = {
    kind: "lesson-started",
  }

  return JSON.stringify(answer)
}

export function createLessonStepAnswer(
  payload: LessonStepAnswerPayload
): string {
  return JSON.stringify(payload)
}

export function formatEstimatedMinutes(minutes: number): string {
  return `예상 ${minutes}분`
}

export function formatStepCount(stepCount: number): string {
  return `${stepCount}개 스텝`
}

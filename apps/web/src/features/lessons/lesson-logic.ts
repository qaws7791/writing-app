import type { Lesson, LessonStep } from "@/features/lessons/lesson-types"

export type LessonStartedAnswer = {
  readonly kind: "lesson-started"
}

export type LessonAnswerChange = {
  readonly answer: string
  readonly stepId: string
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
  return lesson.steps[0] ?? null
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

import type { Lesson, LessonStep } from "@/features/lessons/lesson-types"

export type LessonStartedAnswer = {
  readonly kind: "lesson-started"
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

export function formatEstimatedMinutes(minutes: number): string {
  return `예상 ${minutes}분`
}

export function formatStepCount(stepCount: number): string {
  return `${stepCount}개 스텝`
}

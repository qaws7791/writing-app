import type { LessonId, LessonStepId } from "@/features/lessons/lesson-types"

export function lessonId(value: string): LessonId {
  return value as LessonId
}

export function lessonStepId(value: string): LessonStepId {
  return value as LessonStepId
}

import type {
  Lesson,
  LessonStep,
  LessonStepDraftAnswer,
} from "@/features/lesson-session/model/lesson-view-model"

export type LessonStepAnswerPayload = LessonStepDraftAnswer

export function getLessonStep(
  lesson: Lesson,
  stepIndex: number
): LessonStep | null {
  return lesson.steps[stepIndex] ?? null
}

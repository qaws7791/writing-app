import type { AiFeedbackResultDto } from "@workspace/contracts/ai-feedback"
import type {
  LearnerLesson,
  LearnerLessonStep,
  LearnerStepSubmission,
} from "@workspace/contracts/learning"

export type LessonAiFeedback = AiFeedbackResultDto
export type LessonStepAnswerPayload = LearnerStepSubmission

export type LessonAnswerChange = {
  readonly answer: LessonStepAnswerPayload
  readonly stepId: string
}

export type LessonAiFeedbackRequest = { readonly stepId: string }
export type LessonAiFeedbackOutcome =
  | { readonly feedback: LessonAiFeedback; readonly status: "ok" }
  | { readonly message: string; readonly status: "error" }

export function getFirstLessonStep(
  lesson: LearnerLesson
): LearnerLessonStep | null {
  return getLessonStep(lesson, 0)
}

export function getLessonStep(
  lesson: LearnerLesson,
  stepIndex: number
): LearnerLessonStep | null {
  return lesson.steps[stepIndex] ?? null
}

export function isLastLessonStep(
  lesson: LearnerLesson,
  stepIndex: number
): boolean {
  return stepIndex === lesson.steps.length - 1
}

export function formatEstimatedMinutes(minutes: number): string {
  return `예상 ${minutes}분`
}

export function formatStepCount(stepCount: number): string {
  return `${stepCount}개 스텝`
}

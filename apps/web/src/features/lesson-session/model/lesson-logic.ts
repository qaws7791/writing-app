import type { AiFeedbackResultDto } from "@workspace/contracts/ai-feedback/feedback"
import type {
  LearnerLesson,
  LearnerLessonStep,
} from "@workspace/contracts/learning/learner-content"
import type { LearnerStepSubmission } from "@workspace/contracts/learning/learner-transition"

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

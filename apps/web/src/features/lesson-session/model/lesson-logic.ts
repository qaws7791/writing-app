import type {
  LearnerAiFeedbackResultDto,
  LearnerLessonDto,
  LearnerLessonStepDto,
  LearnerStepDraftAnswerDto,
} from "@/shared/http/learner-api-client"

export type LessonAiFeedback = LearnerAiFeedbackResultDto["feedback"]
export type LessonStepAnswerPayload = LearnerStepDraftAnswerDto

export type LessonAiFeedbackRequest = { readonly stepId: string }
export type LessonAiFeedbackSkipOutcome =
  | { readonly status: "ok" }
  | { readonly message: string; readonly status: "error" }
export type LessonAiFeedbackOutcome =
  | { readonly feedback: LessonAiFeedback; readonly status: "ok" }
  | {
      readonly kind: "fatal" | "limit" | "quota" | "retryable"
      readonly message: string
      readonly retryAfterSeconds?: number
      readonly status: "error"
    }

export function getFirstLessonStep(
  lesson: LearnerLessonDto
): LearnerLessonStepDto | null {
  return getLessonStep(lesson, 0)
}

export function getLessonStep(
  lesson: LearnerLessonDto,
  stepIndex: number
): LearnerLessonStepDto | null {
  return lesson.steps[stepIndex] ?? null
}

import type {
  Lesson,
  LessonAiFeedback,
  LessonStep,
  LessonStepDraftAnswer,
} from "@/features/lesson-session/model/lesson-view-model"

export type { LessonAiFeedback }
export type LessonStepAnswerPayload = LessonStepDraftAnswer

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

export function getLessonStep(
  lesson: Lesson,
  stepIndex: number
): LessonStep | null {
  return lesson.steps[stepIndex] ?? null
}

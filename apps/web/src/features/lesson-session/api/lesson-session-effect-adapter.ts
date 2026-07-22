import type {
  CompleteLearnerStepBody,
  CompleteLearnerStepResult,
} from "@workspace/contracts/learning/learner-transition"
import type { LessonLearningState } from "@workspace/contracts/learning/learner-content"

import type { LessonAiFeedback } from "@/features/lesson-session/model/lesson-logic"
import type { LessonSessionApi } from "@/features/lesson-session/api/lesson-session-api"

type TransitionEffectOutcome =
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ok"; readonly transition: CompleteLearnerStepResult }

type AiFeedbackEffectOutcome =
  | {
      readonly feedback: LessonAiFeedback
      readonly status: "ok"
      readonly transition: CompleteLearnerStepResult
    }
  | {
      readonly message: string
      readonly retryable: boolean
      readonly status: "error"
    }

export type LessonSessionEffects = {
  readonly completeStep: (input: {
    readonly request: CompleteLearnerStepBody
    readonly stepId: string
  }) => Promise<TransitionEffectOutcome>
  readonly requestAiFeedback: (input: {
    readonly idempotencyKey: string
    readonly stepId: string
  }) => Promise<AiFeedbackEffectOutcome>
  readonly start: () => Promise<
    | { readonly learning: LessonLearningState; readonly status: "ok" }
    | { readonly message: string; readonly status: "error" }
  >
}

export function createLessonSessionEffects(
  api: LessonSessionApi,
  input: {
    readonly expectedCurriculumVersionId: string
    readonly lessonId: string
  }
): LessonSessionEffects {
  return {
    async completeStep({ request, stepId }) {
      const result = await api.completeStep({
        lessonId: input.lessonId,
        request,
        stepId,
      })

      return result.status === "error"
        ? { message: result.error.message, status: "error" }
        : { status: "ok", transition: result.value }
    },
    async requestAiFeedback({ idempotencyKey, stepId }) {
      const result = await api.requestAiFeedback({
        idempotencyKey,
        lessonId: input.lessonId,
        stepId,
      })

      return result.status === "error"
        ? {
            message: result.error.message,
            retryable: result.error.code === "NETWORK_ERROR",
            status: "error",
          }
        : {
            feedback: result.value.feedback,
            status: "ok",
            transition: result.value.transition,
          }
    },
    async start() {
      const result = await api.startLesson(input)
      return result.status === "error"
        ? { message: result.error.message, status: "error" }
        : { learning: result.value, status: "ok" }
    },
  }
}

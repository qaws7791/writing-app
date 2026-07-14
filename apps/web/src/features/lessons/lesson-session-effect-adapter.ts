import {
  createLessonStartedAnswer,
  type LessonAiFeedback,
  type LessonAnswerChange,
} from "@/features/lessons/lesson-logic"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"

type EffectOutcome = { readonly status: "ok" } | { readonly status: "error" }

export type AiFeedbackEffectOutcome =
  | {
      readonly feedback: LessonAiFeedback
      readonly status: "ok"
    }
  | {
      readonly message: string
      readonly retryable: boolean
      readonly status: "error"
    }

export type LessonSessionEffects = {
  readonly complete: () => Promise<EffectOutcome>
  readonly requestAiFeedback: (input: {
    readonly idempotencyKey: string
    readonly stepId: string
  }) => Promise<AiFeedbackEffectOutcome>
  readonly saveAnswer: (input: {
    readonly answer: LessonAnswerChange["answer"]
    readonly stepId: string
  }) => Promise<EffectOutcome>
  readonly saveProgress: (currentStepIndex: number) => Promise<EffectOutcome>
  readonly start: (firstStepId: string) => Promise<EffectOutcome>
}

export function createLessonSessionEffects(
  api: WritingAppApi,
  lessonId: string
): LessonSessionEffects {
  return {
    async complete() {
      return toEffectOutcome(await api.completeLesson({ lessonId }))
    },
    async requestAiFeedback({ idempotencyKey, stepId }) {
      const result = await api.createAiFeedback({
        idempotencyKey,
        lessonId,
        stepId,
      })

      return result.status === "error"
        ? {
            message: result.error.message,
            retryable: result.error.code === "network-error",
            status: "error",
          }
        : { feedback: result.value, status: "ok" }
    },
    async saveAnswer({ answer, stepId }) {
      return toEffectOutcome(
        await api.saveLessonAnswer({ answer, lessonId, stepId })
      )
    },
    async saveProgress(currentStepIndex) {
      return toEffectOutcome(
        await api.saveLessonProgress({ currentStepIndex, lessonId })
      )
    },
    async start(firstStepId) {
      const answerResult = await api.saveLessonAnswer({
        answer: createLessonStartedAnswer(),
        lessonId,
        stepId: firstStepId,
      })

      if (answerResult.status === "error") {
        return { status: "error" }
      }

      return toEffectOutcome(
        await api.saveLessonProgress({ currentStepIndex: 0, lessonId })
      )
    },
  }
}

function toEffectOutcome(result: {
  readonly status: "error" | "ok"
}): EffectOutcome {
  return result.status === "error" ? { status: "error" } : { status: "ok" }
}

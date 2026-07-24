import {
  completeLearnerStep,
  createLearnerStepAiFeedback,
  startLearnerLesson,
} from "@workspace/http-client/learner"
import type { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

import type { LessonAiFeedback } from "@/features/lesson-session/model/lesson-logic"
import {
  readLearnerApiErrorCode,
  readLearnerApiRetryAfterSeconds,
  settleLearnerApiRequest,
  type LearnerCompleteStepBodyDto,
  type LearnerCompleteStepResultDto,
  type LearnerStartLessonResultDto,
} from "@/shared/http/learner-api-client"

type TransitionEffectOutcome =
  | { readonly status: "error"; readonly message: string }
  | {
      readonly status: "ok"
      readonly transition: LearnerCompleteStepResultDto
    }

type AiFeedbackEffectOutcome =
  | {
      readonly feedback: LessonAiFeedback
      readonly status: "ok"
      readonly transition: LearnerCompleteStepResultDto
    }
  | {
      readonly kind: "fatal" | "limit" | "quota" | "retryable"
      readonly message: string
      readonly reuseIdempotencyKey: boolean
      readonly retryAfterSeconds?: number
      readonly status: "error"
    }

export type LessonSessionEffects = {
  readonly completeStep: (input: {
    readonly request: LearnerCompleteStepBodyDto
    readonly stepId: string
  }) => Promise<TransitionEffectOutcome>
  readonly requestAiFeedback: (input: {
    readonly idempotencyKey: string
    readonly stepId: string
  }) => Promise<AiFeedbackEffectOutcome>
  readonly start: () => Promise<
    | {
        readonly learning: LearnerStartLessonResultDto
        readonly status: "ok"
      }
    | { readonly message: string; readonly status: "error" }
  >
}

export function createLessonSessionEffects(input: {
  readonly expectedCurriculumVersionId: string
  readonly lessonId: string
}): LessonSessionEffects {
  return {
    async completeStep({ request, stepId }) {
      const result = await settleLearnerApiRequest(
        completeLearnerStep(input.lessonId, stepId, request)
      )

      return result.status === "error"
        ? { message: result.error.message, status: "error" }
        : { status: "ok", transition: result.value }
    },
    async requestAiFeedback({ idempotencyKey, stepId }) {
      const result = await settleLearnerApiRequest(
        createLearnerStepAiFeedback(input.lessonId, stepId, {
          headers: { "Idempotency-Key": idempotencyKey },
        })
      )

      return result.status === "error"
        ? toAiFeedbackEffectError(result.error)
        : {
            feedback: result.value.feedback,
            status: "ok",
            transition: result.value.transition,
          }
    },
    async start() {
      const result = await settleLearnerApiRequest(
        startLearnerLesson(input.lessonId, {
          expectedCurriculumVersionId: input.expectedCurriculumVersionId,
        })
      )
      return result.status === "error"
        ? { message: result.error.message, status: "error" }
        : { learning: result.value, status: "ok" }
    },
  }
}

function toAiFeedbackEffectError(
  error: GeneratedApiClientError
): Extract<AiFeedbackEffectOutcome, { readonly status: "error" }> {
  const classification = classifyAiFeedbackError(readLearnerApiErrorCode(error))
  const retryAfterSeconds = readLearnerApiRetryAfterSeconds(error)

  return {
    ...classification,
    message: error.message,
    ...(retryAfterSeconds === null ? {} : { retryAfterSeconds }),
    status: "error",
  }
}

function classifyAiFeedbackError(
  code: string
): Pick<
  Extract<AiFeedbackEffectOutcome, { readonly status: "error" }>,
  "kind" | "reuseIdempotencyKey"
> {
  switch (code) {
    case "AI_FEEDBACK_DAILY_QUOTA_EXCEEDED":
      return { kind: "quota", reuseIdempotencyKey: true }
    case "ATTEMPT_LIMIT_EXCEEDED":
      return { kind: "limit", reuseIdempotencyKey: false }
    case "ATTEMPT_IN_PROGRESS":
    case "NETWORK_ERROR":
    case "REQUEST_ABORTED":
      return { kind: "retryable", reuseIdempotencyKey: true }
    case "PROVIDER_UNAVAILABLE":
      return { kind: "retryable", reuseIdempotencyKey: false }
    default:
      return { kind: "fatal", reuseIdempotencyKey: false }
  }
}

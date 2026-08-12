import {
  completeLearnerStep,
  startLearnerLesson,
} from "@workspace/http-client/learner"

import { getLessonUserMessage } from "@/features/lesson-session/model/lesson-user-message"
import {
  toLessonCompleteStepResult,
  toLessonStartResult,
  type LessonCompleteStepBody,
  type LessonCompleteStepResult,
  type LessonStartResult,
} from "@/features/lesson-session/model/lesson-view-model"
import {
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"

type TransitionEffectOutcome =
  | { readonly status: "error"; readonly message: string }
  | {
      readonly status: "ok"
      readonly transition: LessonCompleteStepResult
    }

export type LessonSessionEffects = {
  readonly completeStep: (input: {
    readonly request: LessonCompleteStepBody
    readonly stepId: string
  }) => Promise<TransitionEffectOutcome>
  readonly start: () => Promise<
    | {
        readonly learning: LessonStartResult
        readonly status: "ok"
      }
    | { readonly message: string; readonly status: "error" }
  >
}

export function createLessonSessionEffects(input: {
  readonly expectedCurriculumVersionId: string
  readonly lessonId: string
  readonly readAbortSignal: () => AbortSignal
}): LessonSessionEffects {
  return {
    async completeStep({ request, stepId }) {
      const result = await settleLearnerApiRequest(
        completeLearnerStep(input.lessonId, stepId, request, {
          signal: input.readAbortSignal(),
        })
      )

      return result.status === "error"
        ? {
            message: getLessonUserMessage(
              "complete",
              readLearnerApiErrorCode(result.error)
            ),
            status: "error",
          }
        : { status: "ok", transition: toLessonCompleteStepResult(result.value) }
    },
    async start() {
      const result = await settleLearnerApiRequest(
        startLearnerLesson(
          input.lessonId,
          {
            expectedCurriculumVersionId: input.expectedCurriculumVersionId,
          },
          { signal: input.readAbortSignal() }
        )
      )
      return result.status === "error"
        ? {
            message: getLessonUserMessage(
              "start",
              readLearnerApiErrorCode(result.error)
            ),
            status: "error",
          }
        : { learning: toLessonStartResult(result.value), status: "ok" }
    },
  }
}

import {
  completeLearnerLesson,
  completeLearnerStep,
  startLearnerLesson,
} from "@workspace/http-client/learner"

import { getLessonUserMessage } from "@/features/lesson-session/model/lesson-user-message"
import {
  toLessonCompleteLessonResult,
  toLessonCompleteStepResult,
  toLessonStartResult,
  type LessonCompleteLessonBody,
  type LessonCompleteLessonResult,
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

type LessonCompleteOutcome =
  | { readonly status: "error"; readonly message: string }
  | {
      readonly completion: LessonCompleteLessonResult
      readonly status: "ok"
    }

type ApiCompleteLearnerStepBody = Parameters<typeof completeLearnerStep>[2]

function toApiCompleteLearnerStepBody(
  request: LessonCompleteStepBody
): ApiCompleteLearnerStepBody {
  if (request.kind === "acknowledge") {
    return { kind: "acknowledge" }
  }

  if (request.acceptIncorrect === true) {
    return {
      acceptIncorrect: true,
      answer: request.answer,
      kind: "answer",
    }
  }

  return {
    answer: request.answer,
    kind: "answer",
  }
}

export type LessonSessionEffects = {
  readonly completeLesson: (input: {
    readonly request: LessonCompleteLessonBody
  }) => Promise<LessonCompleteOutcome>
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
    async completeLesson({ request }) {
      const result = await settleLearnerApiRequest(
        completeLearnerLesson(
          input.lessonId,
          {
            ...(request.answers !== undefined
              ? { answers: request.answers }
              : {}),
            completedStepIds: request.completedStepIds,
            durationSeconds: request.durationSeconds,
            expectedCurriculumVersionId: input.expectedCurriculumVersionId,
            mistakeCount: request.mistakeCount,
            totalAttempts: request.totalAttempts,
          },
          {
            signal: input.readAbortSignal(),
          }
        )
      )

      return result.status === "error"
        ? {
            message: getLessonUserMessage(
              "complete",
              readLearnerApiErrorCode(result.error)
            ),
            status: "error",
          }
        : {
            completion: toLessonCompleteLessonResult(result.value),
            status: "ok",
          }
    },
    async completeStep({ request, stepId }) {
      const result = await settleLearnerApiRequest(
        completeLearnerStep(
          input.lessonId,
          stepId,
          toApiCompleteLearnerStepBody(request),
          {
            signal: input.readAbortSignal(),
          }
        )
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

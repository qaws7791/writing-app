import {
  completeLearnerLesson,
  startLearnerLesson,
} from "@workspace/http-client/learner"

import { getLessonUserMessage } from "@/features/lesson-session/model/lesson-user-message"
import {
  toLessonCompleteLessonResult,
  toLessonStartResult,
  type LessonCompleteLessonBody,
  type LessonCompleteLessonResult,
  type LessonStartResult,
} from "@/features/lesson-session/model/lesson-view-model"
import {
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"

type LessonCompleteOutcome =
  | { readonly status: "error"; readonly message: string }
  | {
      readonly completion: LessonCompleteLessonResult
      readonly status: "ok"
    }

export type LessonSessionEffects = {
  readonly completeLesson: (input: {
    readonly request: LessonCompleteLessonBody
  }) => Promise<LessonCompleteOutcome>
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

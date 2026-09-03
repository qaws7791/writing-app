import {
  completeLearnerLesson,
  saveLearnerLessonProgress,
  startLearnerLesson,
} from "@workspace/http-client/learner"

import type {
  CompleteLearnerLessonBody,
  CompleteLearnerLessonResult,
  SaveLearnerLessonProgressBody,
} from "@workspace/contracts/learning/learner-transition"
import { getLessonUserMessage } from "@/features/lesson-session/model/lesson-user-message"
import {
  toLessonCompleteLessonResult,
  toLessonStartResult,
} from "@/features/lesson-session/model/lesson-view-model"
import {
  isLearnerApiAbortedError,
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"

type LessonCompleteOutcome =
  | { readonly status: "error"; readonly message: string }
  | {
      readonly completion: CompleteLearnerLessonResult
      readonly status: "ok"
    }

type LessonProgressOutcome =
  | { readonly message: string; readonly status: "error" }
  | {
      readonly learning: ReturnType<typeof toLessonStartResult>
      readonly status: "ok"
    }

export type LessonSessionEffects = {
  readonly completeLesson: (input: {
    readonly request: CompleteLearnerLessonBody
  }) => Promise<LessonCompleteOutcome>
  readonly saveProgress: (input: {
    readonly request: SaveLearnerLessonProgressBody
  }) => Promise<LessonProgressOutcome>
  readonly start: () => Promise<
    | {
        readonly learning: ReturnType<typeof toLessonStartResult>
        readonly status: "ok"
      }
    | { readonly status: "aborted" }
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
    async saveProgress({ request }) {
      const result = await settleLearnerApiRequest(
        saveLearnerLessonProgress(
          input.lessonId,
          {
            completedStepIds: request.completedStepIds,
            currentStepId: request.currentStepId,
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
    async start() {
      const result = await settleLearnerApiRequest(
        startLearnerLesson(input.lessonId, {
          expectedCurriculumVersionId: input.expectedCurriculumVersionId,
        })
      )
      if (result.status === "error") {
        if (isLearnerApiAbortedError(result.error)) {
          return { status: "aborted" }
        }
        return {
          message: getLessonUserMessage(
            "start",
            readLearnerApiErrorCode(result.error)
          ),
          status: "error",
        }
      }
      return { learning: toLessonStartResult(result.value), status: "ok" }
    },
  }
}

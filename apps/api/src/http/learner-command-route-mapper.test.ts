import { describe, expect, it } from "vitest"

import type { LearnerTransitionError } from "@workspace/core/learning"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import { err } from "@workspace/kernel/result"
import { AppError } from "@workspace/http-platform/errors"

import { unwrapLearnerCompleteStepResult } from "@/http/learner-command-route-mapper"

const lessonId = lessonIdSchema.parse("lesson-1")
const stepId = lessonStepIdSchema.parse("step-1")

const errorCases = [
  {
    error: { kind: "invalid-request", lessonId, stepId },
    expectedCode: "VALIDATION_ERROR",
    expectedStatus: 400,
  },
  {
    error: { kind: "lesson-not-found", lessonId },
    expectedCode: "LESSON_NOT_FOUND",
    expectedStatus: 404,
  },
  {
    error: { kind: "lesson-locked", lessonId },
    expectedCode: "LESSON_LOCKED",
    expectedStatus: 403,
  },
  {
    error: { kind: "curriculum-version-changed", lessonId },
    expectedCode: "CURRICULUM_VERSION_CHANGED",
    expectedStatus: 409,
  },
  {
    error: { kind: "feedback-answer-not-found", targetStepId: stepId },
    expectedCode: "AI_FEEDBACK_ANSWER_NOT_FOUND",
    expectedStatus: 409,
  },
  {
    error: {
      kind: "feedback-target-invalid",
      reason: "target-step-not-write",
      stepId,
    },
    expectedCode: "INTERNAL_SERVER_ERROR",
    expectedStatus: 500,
  },
  {
    error: { kind: "step-sequence-conflict", lessonId, stepId },
    expectedCode: "STEP_SEQUENCE_CONFLICT",
    expectedStatus: 409,
  },
] as const satisfies readonly {
  readonly error: LearnerTransitionError
  readonly expectedCode: string
  readonly expectedStatus: number
}[]

describe("학습 command HTTP 경계 매퍼", () => {
  it.each(errorCases)(
    "$error.kind expected rejection을 $expectedStatus $expectedCode로 변환한다",
    ({ error, expectedCode, expectedStatus }) => {
      const mapped = captureAppError(() =>
        unwrapLearnerCompleteStepResult(err(error))
      )

      expect(mapped).toMatchObject({
        code: expectedCode,
        status: expectedStatus,
      })
    }
  )
})

function captureAppError(run: () => unknown): AppError {
  try {
    run()
  } catch (error) {
    expect(error).toBeInstanceOf(AppError)
    return error as AppError
  }

  throw new Error("Expected learner command mapper to reject")
}

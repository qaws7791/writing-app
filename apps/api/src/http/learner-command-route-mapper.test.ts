import { describe, expect, it } from "vitest"

import type { AiFeedbackServiceError } from "@workspace/core/ai-feedback"
import type { LearnerTransitionError } from "@workspace/core/learning"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content"
import { AppError } from "@/http/platform/errors"

import { unwrapLearnerAiFeedbackTransitionResult } from "@/http/learner-command-route-mapper"

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
    error: { kind: "attempt-limit-exceeded", remainingAttempts: 0 },
    expectedCode: "ATTEMPT_LIMIT_EXCEEDED",
    expectedStatus: 429,
  },
  {
    error: { kind: "attempt-in-progress", remainingAttempts: 2 },
    expectedCode: "ATTEMPT_IN_PROGRESS",
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
  {
    error: { kind: "provider-failed", remainingAttempts: 2 },
    expectedCode: "PROVIDER_UNAVAILABLE",
    expectedStatus: 503,
  },
] as const satisfies readonly {
  readonly error: AiFeedbackServiceError | LearnerTransitionError
  readonly expectedCode: string
  readonly expectedStatus: number
}[]

describe("학습 command HTTP 경계 매퍼", () => {
  it.each(errorCases)(
    "$error.kind expected rejection을 $expectedStatus $expectedCode로 변환한다",
    ({ error, expectedCode, expectedStatus }) => {
      const mapped = captureAppError(() =>
        unwrapLearnerAiFeedbackTransitionResult({ error, kind: "err" })
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

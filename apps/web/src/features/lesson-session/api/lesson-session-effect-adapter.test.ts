import { beforeEach, describe, expect, it, vi } from "vitest"

import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const generatedClient = vi.hoisted(() => ({
  completeLearnerStep: vi.fn(),
  createLearnerStepAiFeedback: vi.fn(),
  startLearnerLesson: vi.fn(),
}))

vi.mock("@workspace/http-client/learner", () => generatedClient)

import { createLessonSessionEffects } from "@/features/lesson-session/api/lesson-session-effect-adapter"
import type {
  LearnerCompleteStepResultDto,
  LearnerStartLessonResultDto,
} from "@/shared/http/learner-api-client"

const start: LearnerStartLessonResultDto = {
  completedSteps: 0,
  currentStepId: "step-1",
  currentStepIndex: 0,
  drafts: [],
  progressPercent: 0,
  status: "in_progress",
  totalSteps: 2,
  version: { curriculumVersionId: "version-1", revision: 1 },
}

const abortSignal = new AbortController().signal

const advanced: LearnerCompleteStepResultDto = {
  evaluation: null,
  learning: {
    completedSteps: 1,
    currentStepId: "step-2",
    currentStepIndex: 1,
    progressPercent: 50,
    status: "in_progress",
    totalSteps: 2,
    version: start.version,
  },
  status: "advanced",
}

describe("createLessonSessionEffects", () => {
  beforeEach(() => {
    generatedClient.completeLearnerStep.mockReset()
    generatedClient.createLearnerStepAiFeedback.mockReset()
    generatedClient.startLearnerLesson.mockReset()
  })

  it("AI 요청의 멱등성 키를 generated RequestInit에 전달한다", async () => {
    generatedClient.createLearnerStepAiFeedback.mockResolvedValue({
      feedback: {
        improvements: ["문장을 더 구체적으로 써 보세요."],
        nextAction: "한 문장을 고쳐 써 보세요.",
        remainingAttempts: 1,
        strengths: ["핵심 생각이 분명해요."],
        summary: "요약",
      },
      transition: advanced,
    })

    await createEffects().requestAiFeedback({
      idempotencyKey: "feedback-1",
      stepId: "step-ai",
    })

    expect(generatedClient.createLearnerStepAiFeedback).toHaveBeenCalledWith(
      "lesson-1",
      "step-ai",
      {
        headers: { "Idempotency-Key": "feedback-1" },
        signal: abortSignal,
      }
    )
  })

  it.each([
    [
      "provider",
      httpError("PROVIDER_UNAVAILABLE", 503),
      {
        kind: "retryable",
        retryAfterSeconds: undefined,
        reuseIdempotencyKey: false,
      },
    ],
    [
      "pending",
      httpError("ATTEMPT_IN_PROGRESS", 409, 17),
      {
        kind: "retryable",
        retryAfterSeconds: 17,
        reuseIdempotencyKey: true,
      },
    ],
    [
      "daily quota",
      httpError("AI_FEEDBACK_DAILY_QUOTA_EXCEEDED", 429, 3_600),
      { kind: "quota", retryAfterSeconds: 3_600, reuseIdempotencyKey: true },
    ],
    [
      "attempt limit",
      httpError("ATTEMPT_LIMIT_EXCEEDED", 429),
      {
        kind: "limit",
        retryAfterSeconds: undefined,
        reuseIdempotencyKey: false,
      },
    ],
    [
      "network",
      new GeneratedApiClientError({
        kind: "network",
        method: "POST",
        url: "/api/learning/lessons/lesson-1/steps/step-ai/ai-feedback",
      }),
      {
        kind: "retryable",
        retryAfterSeconds: undefined,
        reuseIdempotencyKey: true,
      },
    ],
    [
      "contract",
      new GeneratedApiClientError({
        kind: "contract",
        reason: "invalid-json-response",
        status: 500,
      }),
      {
        kind: "fatal",
        retryAfterSeconds: undefined,
        reuseIdempotencyKey: false,
      },
    ],
  ] as const)(
    "%s 오류를 학습자 UI 상태로 분류한다",
    async (_label, error, expected) => {
      generatedClient.createLearnerStepAiFeedback.mockRejectedValue(error)

      await expect(
        createEffects().requestAiFeedback({
          idempotencyKey: "feedback-1",
          stepId: "step-ai",
        })
      ).resolves.toEqual({
        kind: expected.kind,
        message: expect.any(String),
        retryAfterSeconds: expected.retryAfterSeconds,
        reuseIdempotencyKey: expected.reuseIdempotencyKey,
        status: "error",
      })
    }
  )
})

function createEffects() {
  return createLessonSessionEffects({
    expectedCurriculumVersionId: "version-1",
    lessonId: "lesson-1",
    readAbortSignal: () => abortSignal,
  })
}

function httpError(
  code: string,
  status: number,
  retryAfterSeconds: number | null = null
): GeneratedApiClientError {
  return new GeneratedApiClientError({
    error: {
      code,
      message: "테스트 오류",
      requestId: "request-1",
      violations: [],
    },
    kind: "http",
    retryAfterSeconds,
    status,
  })
}

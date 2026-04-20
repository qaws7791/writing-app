import { describe, expect, it, vi } from "vitest"

import type {
  AiCoachingGateway,
  ProgressRepository,
  SessionAiResult,
  UserSessionStepAiState,
} from "@workspace/core"
import { toSessionId, toUserId } from "@workspace/core"

import { createCapturedLogger } from "../test-support/capture-logger.js"
import { createSessionAiWorker } from "./session-ai-worker.js"

function createPendingFeedbackStep(): UserSessionStepAiState {
  return {
    userId: toUserId("dev-user"),
    sessionId: toSessionId(1),
    stepOrder: 2,
    kind: "feedback",
    sourceStepOrder: 1,
    status: "pending",
    attemptCount: 0,
    inputJson: {
      bodyPlainText: "초안입니다.",
      level: "beginner",
    },
    resultJson: null,
    errorMessage: null,
    updatedAt: "2026-04-20T00:00:00.000Z",
  }
}

function createProgressRepositoryDouble(
  pendingSteps: UserSessionStepAiState[]
): {
  repository: ProgressRepository
  saveSessionStepAiState: ReturnType<typeof vi.fn>
} {
  const saveSessionStepAiState = vi.fn(async () => undefined)

  return {
    repository: {
      getJourneyProgress: vi.fn(),
      listActiveJourneys: vi.fn(),
      listCompletedJourneys: vi.fn(),
      listUserJourneyItems: vi.fn(),
      enrollJourney: vi.fn(),
      updateJourneyProgress: vi.fn(),
      initSessionProgressForJourney: vi.fn(),
      getSessionProgress: vi.fn(),
      startSession: vi.fn(),
      updateSessionProgress: vi.fn(),
      getSessionStepAiState: vi.fn(),
      listSessionStepAiStates: vi.fn(),
      listPendingSessionStepAiStates: vi.fn(async () => pendingSteps),
      saveSessionStepAiState,
    } satisfies ProgressRepository,
    saveSessionStepAiState,
  }
}

describe("createSessionAiWorker", () => {
  it("검증된 AI 결과만 succeeded 상태로 저장한다", async () => {
    const feedbackResult: SessionAiResult = {
      strengths: ["강점"],
      improvements: ["개선점"],
      question: "질문",
    }
    const gateway: AiCoachingGateway = {
      generateFeedback: vi.fn(async () => feedbackResult),
      compareRevisions: vi.fn(),
    }
    const { logger } = createCapturedLogger()
    const { repository, saveSessionStepAiState } =
      createProgressRepositoryDouble([createPendingFeedbackStep()])

    const worker = createSessionAiWorker({
      aiCoachingGateway: gateway,
      logger,
      progressRepository: repository,
    })

    await worker.tick()

    expect(gateway.generateFeedback).toHaveBeenCalledWith({
      bodyPlainText: "초안입니다.",
      level: "beginner",
    })
    expect(saveSessionStepAiState).toHaveBeenNthCalledWith(
      2,
      "dev-user",
      1,
      2,
      expect.objectContaining({
        status: "succeeded",
        resultJson: feedbackResult,
        errorMessage: null,
      })
    )
  })

  it("잘못된 AI 결과는 failed 상태로 저장하고 경고 로그를 남긴다", async () => {
    const gateway: AiCoachingGateway = {
      generateFeedback: vi.fn(
        async () =>
          ({
            strengths: ["강점"],
            improvements: "문자열 개선점",
          }) as never
      ),
      compareRevisions: vi.fn(),
    }
    const { entries, logger } = createCapturedLogger()
    const { repository, saveSessionStepAiState } =
      createProgressRepositoryDouble([createPendingFeedbackStep()])

    const worker = createSessionAiWorker({
      aiCoachingGateway: gateway,
      logger,
      progressRepository: repository,
    })

    await worker.tick()

    expect(saveSessionStepAiState).toHaveBeenNthCalledWith(
      2,
      "dev-user",
      1,
      2,
      expect.objectContaining({
        status: "failed",
        resultJson: null,
        errorMessage:
          "AI 응답 형식이 올바르지 않아 결과를 저장하지 못했습니다.",
      })
    )
    expect(
      entries.find(
        (entry) => entry.msg === "session ai result validation failed"
      )
    ).toEqual(
      expect.objectContaining({
        level: 40,
        scope: "session-ai-worker",
        sessionId: 1,
        stepOrder: 2,
        userId: "dev-user",
        issues: expect.any(Array),
      })
    )
  })
})

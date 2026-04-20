import { describe, expect, it, vi } from "vitest"

import {
  toJourneyId,
  toSessionId,
  toStepId,
  toUserId,
} from "../../../shared/brand/index"
import type { RepositoryTransactionManager } from "../../../shared/transaction/index"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { JourneySessionDetail } from "../../journeys/journey-types"
import type { ProgressRepository } from "../progress-port"
import { makeSubmitStepUseCase } from "./submit-step"

function createSessionDetail(
  steps: JourneySessionDetail["steps"]
): JourneySessionDetail {
  return {
    id: toSessionId(10),
    journeyId: toJourneyId(3),
    order: 1,
    title: "테스트 세션",
    description: "세션 설명",
    estimatedMinutes: 10,
    steps,
  }
}

function createStep(input: {
  order: number
  type: JourneySessionDetail["steps"][number]["type"]
  contentType: JourneySessionDetail["steps"][number]["contentJson"]["content"]["type"]
  content?: Record<string, unknown>
}) {
  return {
    id: toStepId(input.order),
    sessionId: toSessionId(10),
    order: input.order,
    type: input.type,
    contentJson: {
      type: input.contentType,
      content: {
        type: input.contentType,
        ...input.content,
      },
      cta: { label: "다음", variant: "primary" },
    },
  } as JourneySessionDetail["steps"][number]
}

function createProgressRepositoryMock(
  sessionDetail: JourneySessionDetail,
  stepResponsesJson: NonNullable<
    Awaited<ReturnType<ProgressRepository["getSessionProgress"]>>
  >["stepResponsesJson"] = {}
): ProgressRepository {
  const sessionProgress = {
    userId: toUserId("user-1"),
    sessionId: toSessionId(10),
    currentStepOrder: 1,
    status: "in_progress" as const,
    stepResponsesJson,
  }

  return {
    getJourneyProgress: vi.fn(async () => null),
    listActiveJourneys: vi.fn(async () => []),
    listCompletedJourneys: vi.fn(async () => []),
    listUserJourneyItems: vi.fn(async () => []),
    enrollJourney: vi.fn(async () => {
      throw new Error("not used")
    }),
    updateJourneyProgress: vi.fn(async () => {}),
    initSessionProgressForJourney: vi.fn(async () => {}),
    getSessionProgress: vi.fn(async () => sessionProgress),
    startSession: vi.fn(async () => sessionProgress),
    updateSessionProgress: vi.fn(async () => {}),
    getSessionStepAiState: vi.fn(async () => null),
    listSessionStepAiStates: vi.fn(async () => []),
    listPendingSessionStepAiStates: vi.fn(async () => []),
    claimPendingSessionStepAiState: vi.fn(async () => false),
    saveSessionStepAiState: vi.fn(async () => {}),
  }
}

function createJourneyRepositoryMock(
  sessionDetail: JourneySessionDetail,
  sessionCount = 1
): JourneyRepository {
  return {
    list: vi.fn(async () => []),
    getById: vi.fn(async () => ({
      id: sessionDetail.journeyId,
      title: "테스트 여정",
      description: "여정 설명",
      category: "writing_skill" as const,
      thumbnailUrl: null,
      sessionCount,
      sessions: [],
    })),
    getByIdFull: vi.fn(async () => null),
    getSessionDetail: vi.fn(async () => sessionDetail),
    listSessions: vi.fn(async () => []),
    create: vi.fn(async () => {
      throw new Error("not used")
    }),
    update: vi.fn(async () => null),
    delete: vi.fn(async () => {}),
    createSession: vi.fn(async () => {
      throw new Error("not used")
    }),
    updateSession: vi.fn(async () => null),
    deleteSession: vi.fn(async () => {}),
    createStep: vi.fn(async () => {
      throw new Error("not used")
    }),
    updateStep: vi.fn(async () => null),
    deleteStep: vi.fn(async () => {}),
  }
}

function createTransactionManager(
  journeyRepository: JourneyRepository,
  progressRepository: ProgressRepository
): RepositoryTransactionManager {
  return {
    run: (work) =>
      work({
        journeyRepository,
        progressRepository,
        promptRepository: {} as never,
        writingRepository: {} as never,
      }),
  }
}

describe("makeSubmitStepUseCase", () => {
  it("interactive 응답을 저장하고 AI 피드백을 큐잉한다", async () => {
    const sessionDetail = createSessionDetail([
      createStep({
        order: 1,
        type: "WRITING",
        contentType: "WRITING",
      }),
      createStep({
        order: 2,
        type: "AI_FEEDBACK",
        contentType: "AI_FEEDBACK",
        content: { targetStepId: "1" },
      }),
    ])
    const progressRepository = createProgressRepositoryMock(sessionDetail)
    const journeyRepository = createJourneyRepositoryMock(sessionDetail)
    const submitStep = makeSubmitStepUseCase({
      progressRepository,
      journeyRepository,
      transactionManager: createTransactionManager(
        journeyRepository,
        progressRepository
      ),
    })

    const result = await submitStep(toUserId("user-1"), toSessionId(10), {
      stepOrder: 1,
      response: {
        type: "WRITING",
        text: "초안입니다.",
      },
    })

    expect(result.isOk()).toBe(true)
    expect(progressRepository.updateSessionProgress).toHaveBeenCalledWith(
      toUserId("user-1"),
      toSessionId(10),
      {
        currentStepOrder: 2,
        stepResponsesJson: {
          "1": {
            type: "WRITING",
            text: "초안입니다.",
          },
        },
      }
    )
    expect(progressRepository.saveSessionStepAiState).toHaveBeenCalledWith(
      toUserId("user-1"),
      toSessionId(10),
      2,
      expect.objectContaining({
        inputJson: {
          bodyPlainText: "초안입니다.",
          level: "beginner",
        },
        kind: "feedback",
        status: "pending",
      })
    )
  })

  it("응답이 없는 스텝은 저장을 오염시키지 않고 진행만 갱신한다", async () => {
    const sessionDetail = createSessionDetail([
      createStep({
        order: 1,
        type: "AI_FEEDBACK",
        contentType: "AI_FEEDBACK",
        content: { targetStepId: "0" },
      }),
      createStep({
        order: 2,
        type: "COMPLETION",
        contentType: "COMPLETION",
      }),
    ])
    const progressRepository = createProgressRepositoryMock(sessionDetail)
    const journeyRepository = createJourneyRepositoryMock(sessionDetail)
    const submitStep = makeSubmitStepUseCase({
      progressRepository,
      journeyRepository,
      transactionManager: createTransactionManager(
        journeyRepository,
        progressRepository
      ),
    })

    const result = await submitStep(toUserId("user-1"), toSessionId(10), {
      stepOrder: 1,
    })

    expect(result.isOk()).toBe(true)
    expect(progressRepository.updateSessionProgress).toHaveBeenCalledWith(
      toUserId("user-1"),
      toSessionId(10),
      {
        currentStepOrder: 2,
        status: "completed",
        stepResponsesJson: {},
      }
    )
    expect(progressRepository.saveSessionStepAiState).not.toHaveBeenCalled()
  })

  it("현재 스텝 타입과 다른 응답 variant를 거부한다", async () => {
    const sessionDetail = createSessionDetail([
      createStep({
        order: 1,
        type: "MULTIPLE_CHOICE",
        contentType: "MULTIPLE_CHOICE",
      }),
      createStep({
        order: 2,
        type: "COMPLETION",
        contentType: "COMPLETION",
      }),
    ])
    const progressRepository = createProgressRepositoryMock(sessionDetail)
    const journeyRepository = createJourneyRepositoryMock(sessionDetail)
    const submitStep = makeSubmitStepUseCase({
      progressRepository,
      journeyRepository,
      transactionManager: createTransactionManager(
        journeyRepository,
        progressRepository
      ),
    })

    const result = await submitStep(toUserId("user-1"), toSessionId(10), {
      stepOrder: 1,
      response: {
        type: "SHORT_ANSWER",
        text: "틀린 타입",
      },
    })

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "VALIDATION_ERROR",
      field: "response",
    })
    expect(progressRepository.updateSessionProgress).not.toHaveBeenCalled()
  })

  it("퇴고 응답은 기존 초안과 함께 비교 분석을 큐잉한다", async () => {
    const sessionDetail = createSessionDetail([
      createStep({
        order: 1,
        type: "WRITING",
        contentType: "WRITING",
      }),
      createStep({
        order: 2,
        type: "AI_FEEDBACK",
        contentType: "AI_FEEDBACK",
        content: { targetStepId: "1" },
      }),
      createStep({
        order: 3,
        type: "REWRITING",
        contentType: "REWRITING",
        content: { originalWritingStepId: "1", feedbackStepId: "2" },
      }),
      createStep({
        order: 4,
        type: "AI_COMPARISON",
        contentType: "AI_COMPARISON",
        content: { originalStepId: "1", rewritingStepId: "3" },
      }),
    ])
    const progressRepository = createProgressRepositoryMock(sessionDetail, {
      "1": {
        type: "WRITING",
        text: "초안",
      },
    })
    const journeyRepository = createJourneyRepositoryMock(sessionDetail, 2)
    const submitStep = makeSubmitStepUseCase({
      progressRepository,
      journeyRepository,
      transactionManager: createTransactionManager(
        journeyRepository,
        progressRepository
      ),
    })

    const result = await submitStep(toUserId("user-1"), toSessionId(10), {
      stepOrder: 3,
      response: {
        type: "REWRITING",
        text: "퇴고본",
      },
    })

    expect(result.isOk()).toBe(true)
    expect(progressRepository.saveSessionStepAiState).toHaveBeenCalledWith(
      toUserId("user-1"),
      toSessionId(10),
      4,
      expect.objectContaining({
        inputJson: {
          originalText: "초안",
          revisedText: "퇴고본",
        },
        kind: "comparison",
        status: "pending",
      })
    )
  })
})

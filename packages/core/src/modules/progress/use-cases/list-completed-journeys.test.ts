import { describe, expect, it, vi } from "vitest"

import { toJourneyId, toSessionId, toUserId } from "../../../shared/brand/index"
import type { ProgressRepository } from "../progress-port"
import { makeListCompletedJourneysUseCase } from "./list-completed-journeys"

function createProgressRepositoryMock(): ProgressRepository {
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
    getSessionProgress: vi.fn(async () => null),
    startSession: vi.fn(async () => ({
      userId: toUserId("unused-user"),
      sessionId: toSessionId(1),
      currentStepOrder: 1,
      status: "in_progress" as const,
      stepResponsesJson: {},
    })),
    updateSessionProgress: vi.fn(async () => {}),
    getSessionStepAiState: vi.fn(async () => null),
    listSessionStepAiStates: vi.fn(async () => []),
    listPendingSessionStepAiStates: vi.fn(async () => []),
    claimPendingSessionStepAiState: vi.fn(async () => false),
    saveSessionStepAiState: vi.fn(async () => {}),
  }
}

describe("makeListCompletedJourneysUseCase", () => {
  it("완료 여정 목록을 조인 DTO에서 바로 만든다", async () => {
    const userId = toUserId("user-1")
    const progressRepository = createProgressRepositoryMock()

    progressRepository.listUserJourneyItems = vi.fn(async () => [
      {
        id: toJourneyId(1),
        title: "문장 훈련",
        description: "짧은 문장부터 다듬는 여정",
        category: "writing_skill" as const,
        thumbnailUrl: null,
        sessionCount: 3,
        currentSessionOrder: 4,
        completionRate: 1,
        status: "completed" as const,
      },
    ])

    const listCompletedJourneys = makeListCompletedJourneysUseCase({
      progressRepository,
    })

    const result = await listCompletedJourneys(userId)

    expect(result.isOk()).toBe(true)
    expect(progressRepository.listUserJourneyItems).toHaveBeenCalledWith(
      userId,
      "completed"
    )
    expect(progressRepository.listCompletedJourneys).not.toHaveBeenCalled()
    expect(result._unsafeUnwrap()).toEqual([
      {
        journeyId: toJourneyId(1),
        title: "문장 훈련",
        description: "짧은 문장부터 다듬는 여정",
        thumbnailUrl: null,
      },
    ])
  })
})

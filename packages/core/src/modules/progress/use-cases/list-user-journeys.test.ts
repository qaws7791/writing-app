import { describe, expect, it, vi } from "vitest"

import { toJourneyId, toSessionId, toUserId } from "../../../shared/brand/index"
import type { ProgressRepository } from "../progress-port"
import { makeListUserJourneysUseCase } from "./list-user-journeys"

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
    saveSessionStepAiState: vi.fn(async () => {}),
  }
}

describe("makeListUserJourneysUseCase", () => {
  it("진행 상태별 목록을 단일 조인 DTO에서 만든다", async () => {
    const userId = toUserId("user-2")
    const progressRepository = createProgressRepositoryMock()

    vi.mocked(progressRepository.listUserJourneyItems).mockResolvedValue([
      {
        id: toJourneyId(2),
        title: "에세이 구조",
        description: "서론과 본론, 결론을 정리하는 여정",
        category: "writing_skill",
        thumbnailUrl: "https://example.com/essay.png",
        sessionCount: 5,
        currentSessionOrder: 2,
        completionRate: 0.2,
        status: "in_progress",
      },
    ])

    const listUserJourneys = makeListUserJourneysUseCase({
      progressRepository,
    })

    const result = await listUserJourneys(userId, "in_progress")

    expect(result.isOk()).toBe(true)
    expect(progressRepository.listUserJourneyItems).toHaveBeenCalledWith(
      userId,
      "in_progress"
    )
    expect(progressRepository.listActiveJourneys).not.toHaveBeenCalled()
    expect(progressRepository.listCompletedJourneys).not.toHaveBeenCalled()
    expect(result._unsafeUnwrap()).toEqual([
      {
        id: toJourneyId(2),
        title: "에세이 구조",
        description: "서론과 본론, 결론을 정리하는 여정",
        category: "writing_skill",
        thumbnailUrl: "https://example.com/essay.png",
        sessionCount: 5,
      },
    ])
  })
})

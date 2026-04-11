import { describe, expect, it, vi } from "vitest"

import { toJourneyId, toSessionId, toUserId } from "../../../shared/brand/index"
import type { ProgressRepository } from "../../progress/progress-port"
import type { JourneyRepository } from "../../journeys/journey-port"
import { makeGetHomeUseCase } from "./get-home"

describe("makeGetHomeUseCase", () => {
  it("홈 스냅샷을 수집한다", async () => {
    const userId = toUserId("user-1")
    const journeyId = toJourneyId(1)

    const progressRepository: ProgressRepository = {
      listActiveJourneys: vi.fn(async () => [
        {
          userId,
          journeyId,
          currentSessionOrder: 2,
          completionRate: 0.5,
          status: "in_progress" as const,
        },
      ]),
      listCompletedJourneys: vi.fn(async () => []),
      getJourneyProgress: vi.fn(async () => null),
      enrollJourney: vi.fn(async () => ({
        userId,
        journeyId,
        currentSessionOrder: 1,
        completionRate: 0,
        status: "in_progress" as const,
      })),
      updateJourneyProgress: vi.fn(async () => {}),
      initSessionProgressForJourney: vi.fn(async () => {}),
      getSessionProgress: vi.fn(async () => null),
      startSession: vi.fn(async () => ({
        userId,
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

    const journeyRepository: JourneyRepository = {
      list: vi.fn(async () => []),
      getById: vi.fn(async () => ({
        id: journeyId,
        title: "에세이 기초",
        description: "에세이 쓰기 기초 여정",
        category: "writing_skill" as const,
        thumbnailUrl: null,
        sessionCount: 4,
        sessions: [],
      })),
      getSessionDetail: vi.fn(async () => null),
    }

    const getHome = makeGetHomeUseCase({
      progressRepository,
      journeyRepository,
    })

    const result = await getHome(userId)

    expect(result.isOk()).toBe(true)

    const snapshot = result._unsafeUnwrap()
    expect(snapshot.activeJourneys).toHaveLength(1)
    expect(snapshot.activeJourneys[0]?.title).toBe("에세이 기초")
    expect(snapshot.activeJourneys[0]?.completionRate).toBe(0.25)
    expect(snapshot.showStartJourneyCta).toBe(false)
    expect(snapshot.showWritingSuggestion).toBe(true)
  })

  it("진행 중인 여정이 없으면 시작 CTA를 표시한다", async () => {
    const userId = toUserId("user-2")

    const progressRepository: ProgressRepository = {
      listActiveJourneys: vi.fn(async () => []),
      listCompletedJourneys: vi.fn(async () => []),
      getJourneyProgress: vi.fn(async () => null),
      enrollJourney: vi.fn(async () => ({
        userId,
        journeyId: toJourneyId(1),
        currentSessionOrder: 1,
        completionRate: 0,
        status: "in_progress" as const,
      })),
      updateJourneyProgress: vi.fn(async () => {}),
      initSessionProgressForJourney: vi.fn(async () => {}),
      getSessionProgress: vi.fn(async () => null),
      startSession: vi.fn(async () => {
        throw new Error("not used")
      }),
      updateSessionProgress: vi.fn(async () => {}),
      getSessionStepAiState: vi.fn(async () => null),
      listSessionStepAiStates: vi.fn(async () => []),
      listPendingSessionStepAiStates: vi.fn(async () => []),
      saveSessionStepAiState: vi.fn(async () => {}),
    }

    const journeyRepository: JourneyRepository = {
      list: vi.fn(async () => []),
      getById: vi.fn(async () => null),
      getSessionDetail: vi.fn(async () => null),
    }

    const getHome = makeGetHomeUseCase({
      progressRepository,
      journeyRepository,
    })

    const result = await getHome(userId)

    expect(result.isOk()).toBe(true)
    const snapshot = result._unsafeUnwrap()
    expect(snapshot.activeJourneys).toHaveLength(0)
    expect(snapshot.showStartJourneyCta).toBe(true)
    expect(snapshot.showWritingSuggestion).toBe(true)
  })
})

import { describe, expect, it, vi } from "vitest"

import {
  toJourneyId,
  toPromptId,
  toSessionId,
  toUserId,
} from "../../../shared/brand/index"
import type { PromptRepository } from "../../prompts/prompt-port"
import type { ProgressRepository } from "../../progress/progress-port"
import type { JourneyRepository } from "../../journeys/journey-port"
import { makeGetHomeUseCase } from "./get-home"

describe("makeGetHomeUseCase", () => {
  it("홈 스냅샷을 수집한다", async () => {
    const userId = toUserId("user-1")
    const journeyId = toJourneyId(1)

    const promptRepository: PromptRepository = {
      getDailyPrompt: vi.fn(async () => ({
        id: toPromptId(3),
        promptType: "reflection" as const,
        title: "오늘의 글감",
        body: "오늘 가장 기억에 남는 순간은?",
        thumbnailUrl: "https://picsum.photos/seed/prompt-1/600/400",
        responseCount: 5,
        isBookmarked: false,
      })),
      getById: vi.fn(async () => null),
      list: vi.fn(async () => ({ items: [], nextCursor: null })),
      bookmark: vi.fn(async () => ({ kind: "not-found" as const })),
      unbookmark: vi.fn(async () => {}),
    }

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
      promptRepository,
      progressRepository,
      journeyRepository,
    })

    const result = await getHome(userId)

    expect(result.isOk()).toBe(true)

    const snapshot = result._unsafeUnwrap()
    expect(snapshot.dailyPrompt?.title).toBe("오늘의 글감")
    expect(snapshot.activeJourneys).toHaveLength(1)
    expect(snapshot.activeJourneys[0]?.title).toBe("에세이 기초")
    expect(snapshot.activeJourneys[0]?.completionRate).toBe(0.25)
  })

  it("일일 글감이 없으면 null을 반환한다", async () => {
    const userId = toUserId("user-2")

    const promptRepository: PromptRepository = {
      getDailyPrompt: vi.fn(async () => null),
      getById: vi.fn(async () => null),
      list: vi.fn(async () => ({ items: [], nextCursor: null })),
      bookmark: vi.fn(async () => ({ kind: "not-found" as const })),
      unbookmark: vi.fn(async () => {}),
    }

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
      promptRepository,
      progressRepository,
      journeyRepository,
    })

    const result = await getHome(userId)

    expect(result.isOk()).toBe(true)
    const snapshot = result._unsafeUnwrap()
    expect(snapshot.dailyPrompt).toBeNull()
    expect(snapshot.activeJourneys).toHaveLength(0)
  })
})

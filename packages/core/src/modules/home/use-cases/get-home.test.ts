import { describe, expect, it, vi } from "vitest"

import { toDraftId, toPromptId, toUserId } from "../../../shared/brand/index"
import type { DraftRepository } from "../../drafts/draft-port"
import type { PromptRepository } from "../../prompts/prompt-port"
import { makeGetHomeUseCase } from "./get-home"

describe("makeGetHomeUseCase", () => {
  it("홈 스냅샷을 수집한다", async () => {
    const userId = toUserId("user-1")
    const listDrafts = vi.fn(async () => [
      {
        characterCount: 10,
        id: toDraftId(1),
        lastSavedAt: "2026-03-22T00:00:00.000Z",
        preview: "최근 초안",
        sourcePromptId: null,
        title: "최근 초안",
        wordCount: 2,
      },
    ])
    const listSaved = vi.fn(async () => [
      {
        id: toPromptId(10),
        level: 1 as const,
        saved: true,
        suggestedLengthLabel: "짧음" as const,
        tags: ["회고"],
        text: "저장된 글감",
        topic: "자기이해" as const,
      },
    ])
    const listTodayPrompts = vi.fn(async () => [
      {
        id: toPromptId(3),
        level: 2 as const,
        saved: false,
        suggestedLengthLabel: "보통" as const,
        tags: ["오늘"],
        text: "오늘의 글감",
        topic: "일상" as const,
      },
    ])

    const draftRepository = {
      create: async () => {
        throw new Error("not used")
      },
      delete: async () => ({ kind: "deleted" as const }),
      getById: async () => ({ kind: "not-found" as const }),
      list: listDrafts,
      replace: async () => ({ kind: "not-found" as const }),
      resume: async () => ({
        characterCount: 10,
        id: toDraftId(1),
        lastSavedAt: "2026-03-22T00:00:00.000Z",
        preview: "최근 초안",
        sourcePromptId: null,
        title: "최근 초안",
        wordCount: 2,
      }),
    } satisfies DraftRepository

    const promptRepository = {
      exists: async () => true,
      getById: async () => null,
      list: async () => [],
      listSaved,
      listTodayPrompts,
      save: async () => ({
        kind: "saved" as const,
        savedAt: "2026-03-22T00:00:00.000Z",
      }),
      unsave: async () => true,
    } satisfies PromptRepository

    const getHome = makeGetHomeUseCase({ draftRepository, promptRepository })
    const result = await getHome(userId)

    expect(result.isOk()).toBe(true)

    const snapshot = result._unsafeUnwrap()
    expect(listDrafts).toHaveBeenCalledWith(userId, 10)
    expect(listSaved).toHaveBeenCalledWith(userId, 10)
    expect(listTodayPrompts).toHaveBeenCalledWith(userId, 4)
    expect(snapshot.resumeDraft?.id).toBe(toDraftId(1))
    expect(snapshot.savedPrompts).toHaveLength(1)
    expect(snapshot.todayPrompts).toHaveLength(1)
    expect(snapshot.recentDrafts).toHaveLength(1)
  })
})

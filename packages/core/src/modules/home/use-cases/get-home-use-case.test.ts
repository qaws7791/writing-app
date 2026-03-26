import { describe, expect, it, vi } from "vitest"

import { toWritingId, toPromptId, toUserId } from "../../../shared/brand/index"
import type { WritingRepository } from "../../writings/writing-crud-port"
import type { PromptRepository } from "../../prompts/prompt-port"
import { makeGetHomeUseCase } from "./get-home-use-case"

describe("makeGetHomeUseCase", () => {
  it("collects the home snapshot with the expected repository limits", async () => {
    const userId = toUserId("user-1")
    const listWritings = vi.fn(async () => ({
      items: [
        {
          characterCount: 10,
          id: toWritingId(1),
          lastSavedAt: "2026-03-22T00:00:00.000Z",
          preview: "최근 글",
          sourcePromptId: null,
          title: "최근 글",
          wordCount: 2,
        },
      ],
      nextCursor: null,
      hasMore: false,
    }))
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

    const writingRepository = {
      create: async () => {
        throw new Error("not used")
      },
      delete: async () => ({ kind: "deleted" as const }),
      getById: async () => ({ kind: "not-found" as const }),
      list: listWritings,
      replace: async () => ({ kind: "not-found" as const }),
      resume: async () => ({
        characterCount: 10,
        id: toWritingId(1),
        lastSavedAt: "2026-03-22T00:00:00.000Z",
        preview: "최근 글",
        sourcePromptId: null,
        title: "최근 글",
        wordCount: 2,
      }),
    } satisfies WritingRepository

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

    const getHome = makeGetHomeUseCase({
      writingRepository,
      promptRepository,
    })

    const result = await getHome(userId)

    expect(listWritings).toHaveBeenCalledWith(userId, { limit: 10 })
    expect(listSaved).toHaveBeenCalledWith(userId, 10)
    expect(listTodayPrompts).toHaveBeenCalledWith(userId, 4)
    expect(result.resumeWriting?.id).toBe(toWritingId(1))
    expect(result.savedPrompts).toHaveLength(1)
    expect(result.todayPrompts).toHaveLength(1)
  })
})

import {
  toDraftId,
  toPromptId,
  toUserId,
  type DraftRepository,
  type PromptRepository,
} from "@workspace/domain"

import { createHomeUseCases } from "./home-use-cases.js"

describe("createHomeUseCases", () => {
  test("combines today prompts, resume draft, recent drafts, and saved prompts", async () => {
    const promptRepository: PromptRepository = {
      exists: vi.fn(),
      getById: vi.fn(),
      list: vi.fn(),
      listSaved: vi.fn().mockResolvedValue([
        {
          id: toPromptId(8),
          level: 1,
          saved: true,
          suggestedLengthLabel: "짧음",
          tags: ["저장"],
          text: "저장 글감",
          topic: "일상",
        },
      ]),
      listTodayPrompts: vi.fn().mockResolvedValue(
        Array.from({ length: 4 }, (_, index) => ({
          id: toPromptId(index + 1),
          level: 1,
          saved: false,
          suggestedLengthLabel: "짧음" as const,
          tags: [],
          text: `글감 ${index + 1}`,
          topic: "일상" as const,
        }))
      ),
      save: vi.fn(),
      unsave: vi.fn(),
    }
    const draftRepository: DraftRepository = {
      create: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(),
      list: vi.fn().mockResolvedValue([
        {
          characterCount: 10,
          id: toDraftId(2),
          lastSavedAt: "2026-03-20T00:00:00.000Z",
          preview: "둘째 초안",
          sourcePromptId: null,
          title: "둘째",
          wordCount: 2,
        },
      ]),
      replace: vi.fn(),
      resume: vi.fn().mockResolvedValue({
        characterCount: 12,
        id: toDraftId(3),
        lastSavedAt: "2026-03-20T01:00:00.000Z",
        preview: "이어쓰기",
        sourcePromptId: toPromptId(1),
        title: "이어서",
        wordCount: 3,
      }),
    }

    const useCases = createHomeUseCases(draftRepository, promptRepository)
    const result = await useCases.getHome(toUserId("dev-user"))

    expect(promptRepository.listTodayPrompts).toHaveBeenCalledWith(
      "dev-user",
      4
    )
    expect(draftRepository.list).toHaveBeenCalledWith("dev-user", 10)
    expect(promptRepository.listSaved).toHaveBeenCalledWith("dev-user", 10)
    expect(result.todayPrompts).toHaveLength(4)
    expect(result.resumeDraft?.id).toBe(3)
    expect(result.recentDrafts[0]?.id).toBe(2)
    expect(result.savedPrompts[0]?.saved).toBe(true)
  })
})

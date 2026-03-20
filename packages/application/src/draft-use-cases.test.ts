import {
  createEmptyDraftContent,
  toDraftId,
  toPromptId,
  toUserId,
  type DraftRepository,
  type PromptRepository,
} from "@workspace/domain"

import { ForbiddenError, NotFoundError, ValidationError } from "./errors.js"
import { createDraftUseCases } from "./draft-use-cases.js"

function createDraftRepository(): DraftRepository {
  return {
    create: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    replace: vi.fn(),
    resume: vi.fn(),
  }
}

function createPromptRepository(): PromptRepository {
  return {
    exists: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    listSaved: vi.fn(),
    listTodayPrompts: vi.fn(),
    save: vi.fn(),
    unsave: vi.fn(),
  }
}

describe("createDraftUseCases", () => {
  test("validates autosave input requires title or content", async () => {
    const draftRepository = createDraftRepository()
    const promptRepository = createPromptRepository()
    const useCases = createDraftUseCases(draftRepository, promptRepository)

    await expect(
      useCases.autosaveDraft(toUserId("dev-user"), toDraftId(1), {})
    ).rejects.toBeInstanceOf(ValidationError)
  })

  test("checks source prompt existence before creating draft", async () => {
    const draftRepository = createDraftRepository()
    const promptRepository = createPromptRepository()
    vi.mocked(promptRepository.exists).mockResolvedValue(false)
    const useCases = createDraftUseCases(draftRepository, promptRepository)

    await expect(
      useCases.createDraft(toUserId("dev-user"), {
        sourcePromptId: toPromptId(88),
      })
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  test("recalculates metrics when autosaving content", async () => {
    const draftRepository = createDraftRepository()
    const promptRepository = createPromptRepository()
    vi.mocked(draftRepository.getById).mockResolvedValue({
      draft: {
        characterCount: 0,
        content: createEmptyDraftContent(),
        createdAt: "2026-03-20T00:00:00.000Z",
        id: toDraftId(1),
        lastSavedAt: "2026-03-20T00:00:00.000Z",
        preview: "",
        sourcePromptId: null,
        title: "",
        updatedAt: "2026-03-20T00:00:00.000Z",
        wordCount: 0,
      },
      kind: "draft",
    })
    vi.mocked(draftRepository.replace).mockResolvedValue({
      draft: {
        characterCount: 8,
        content: {
          content: [
            {
              content: [{ text: "자동 저장", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "doc",
        },
        createdAt: "2026-03-20T00:00:00.000Z",
        id: toDraftId(1),
        lastSavedAt: "2026-03-20T01:00:00.000Z",
        preview: "자동 저장",
        sourcePromptId: null,
        title: "새 제목",
        updatedAt: "2026-03-20T01:00:00.000Z",
        wordCount: 2,
      },
      kind: "draft",
    })
    const useCases = createDraftUseCases(draftRepository, promptRepository)

    const result = await useCases.autosaveDraft(
      toUserId("dev-user"),
      toDraftId(1),
      {
        content: {
          content: [
            {
              content: [{ text: "자동 저장", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "doc",
        },
        title: "새 제목",
      }
    )

    expect(draftRepository.replace).toHaveBeenCalledWith("dev-user", 1, {
      characterCount: 5,
      content: {
        content: [
          {
            content: [{ text: "자동 저장", type: "text" }],
            type: "paragraph",
          },
        ],
        type: "doc",
      },
      plainText: "자동 저장",
      sourcePromptId: null,
      title: "새 제목",
      wordCount: 2,
    })
    expect(result.kind).toBe("autosaved")
  })

  test("propagates forbidden and not found branches", async () => {
    const draftRepository = createDraftRepository()
    const promptRepository = createPromptRepository()
    vi.mocked(draftRepository.getById)
      .mockResolvedValueOnce({
        kind: "forbidden",
        ownerId: toUserId("other-user"),
      })
      .mockResolvedValueOnce({
        kind: "not-found",
      })
    vi.mocked(draftRepository.delete).mockResolvedValue({
      kind: "forbidden",
      ownerId: toUserId("other-user"),
    })

    const useCases = createDraftUseCases(draftRepository, promptRepository)

    await expect(
      useCases.getDraft(toUserId("dev-user"), toDraftId(3))
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      useCases.autosaveDraft(toUserId("dev-user"), toDraftId(4), {
        title: "x",
      })
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      useCases.deleteDraft(toUserId("dev-user"), toDraftId(5))
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  test("passes list through to the repository", async () => {
    const draftRepository = createDraftRepository()
    const promptRepository = createPromptRepository()
    vi.mocked(draftRepository.list).mockResolvedValue([])
    const useCases = createDraftUseCases(draftRepository, promptRepository)

    await useCases.listDrafts(toUserId("dev-user"), 5)

    expect(draftRepository.list).toHaveBeenCalledWith("dev-user", 5)
  })
})

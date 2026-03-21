import { describe, expect, it, vi } from "vitest"

import { toDraftId, toPromptId, toUserId } from "../../../shared/brand/index"
import type {
  DraftAccessResult,
  DraftDeleteResult,
  DraftDetail,
  DraftMutationResult,
  DraftPersistInput,
  DraftRepository,
  DraftSummary,
} from "../../../shared/ports/index"
import { createEmptyDraftContent } from "../../../shared/utilities/index"
import { makeCreateDraftUseCase } from "./create-draft-use-case"

const userId = toUserId("user-1")

function createDraftRepositoryStub(
  onCreate: (input: DraftPersistInput) => DraftDetail
) {
  return {
    create: async (_userId, input) => onCreate(input),
    delete: async (): Promise<DraftDeleteResult> => ({ kind: "deleted" }),
    getById: async (): Promise<DraftAccessResult> => ({ kind: "not-found" }),
    list: async (): Promise<readonly DraftSummary[]> => [],
    replace: async (): Promise<DraftMutationResult> => ({ kind: "not-found" }),
    resume: async (): Promise<DraftSummary | null> => null,
  } satisfies DraftRepository
}

describe("makeCreateDraftUseCase", () => {
  it("creates a draft with normalized defaults and prompt validation", async () => {
    const sourcePromptId = toPromptId(7)
    const promptExists = vi.fn(async () => true)
    const repository = createDraftRepositoryStub((input) => ({
      ...input,
      createdAt: "2026-03-22T00:00:00.000Z",
      id: toDraftId(11),
      lastSavedAt: "2026-03-22T00:00:00.000Z",
      preview: input.plainText.slice(0, 100),
      updatedAt: "2026-03-22T00:00:00.000Z",
    }))

    const createDraft = makeCreateDraftUseCase({
      createDraftId: () => toDraftId(99),
      draftRepository: repository,
      getNow: () => "2026-03-22T00:00:00.000Z",
      promptExists,
    })

    const result = await createDraft(userId, {
      sourcePromptId,
      title: "새 글",
    })

    expect(promptExists).toHaveBeenCalledWith(sourcePromptId)
    expect("kind" in result ? result.kind : undefined).toBe("success")

    if (!("kind" in result) || result.kind !== "success") {
      throw new Error("expected create draft to succeed")
    }

    expect(result.draft.id).toBe(toDraftId(11))
    expect(result.draft.title).toBe("새 글")
    expect(result.draft.content).toEqual(createEmptyDraftContent())
  })

  it("returns a prompt not found error when the source prompt is missing", async () => {
    const sourcePromptId = toPromptId(3)
    const createDraft = makeCreateDraftUseCase({
      createDraftId: () => toDraftId(99),
      draftRepository: createDraftRepositoryStub((input) => ({
        ...input,
        createdAt: "2026-03-22T00:00:00.000Z",
        id: toDraftId(11),
        lastSavedAt: "2026-03-22T00:00:00.000Z",
        preview: input.plainText.slice(0, 100),
        updatedAt: "2026-03-22T00:00:00.000Z",
      })),
      getNow: () => "2026-03-22T00:00:00.000Z",
      promptExists: async () => false,
    })

    const result = await createDraft(userId, {
      sourcePromptId,
    })

    expect(result).toMatchObject({
      code: "NOT_FOUND",
      entity: "prompt",
      id: sourcePromptId,
      message: "글감을 찾을 수 없습니다.",
    })
  })
})

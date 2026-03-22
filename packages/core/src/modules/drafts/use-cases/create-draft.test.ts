import { describe, expect, it, vi } from "vitest"

import { toDraftId, toPromptId, toUserId } from "../../../shared/brand/index"
import type { DraftDetail, DraftPersistInput } from "../draft-types"
import type { DraftRepository } from "../draft-port"
import { createEmptyDraftContent } from "../../../shared/utilities/draft-content-utilities"
import { makeCreateDraftUseCase } from "./create-draft"

const userId = toUserId("user-1")

function createStubRepository(
  onCreate: (input: DraftPersistInput) => DraftDetail
): DraftRepository {
  return {
    create: async (_userId, input) => onCreate(input),
    delete: async () => ({ kind: "deleted" }),
    getById: async () => ({ kind: "not-found" }),
    list: async () => [],
    replace: async () => ({ kind: "not-found" }),
    resume: async () => null,
  }
}

describe("makeCreateDraftUseCase", () => {
  it("프롬프트 검증 후 초안을 생성한다", async () => {
    const sourcePromptId = toPromptId(7)
    const promptExists = vi.fn(async () => true)
    const repository = createStubRepository((input) => ({
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

    expect(result.isOk()).toBe(true)

    const draft = result._unsafeUnwrap()
    expect(promptExists).toHaveBeenCalledWith(sourcePromptId)
    expect(draft.id).toBe(toDraftId(11))
    expect(draft.title).toBe("새 글")
    expect(draft.content).toEqual(createEmptyDraftContent())
  })

  it("프롬프트 없이 초안을 생성한다", async () => {
    const repository = createStubRepository((input) => ({
      ...input,
      createdAt: "2026-03-22T00:00:00.000Z",
      id: toDraftId(1),
      lastSavedAt: "2026-03-22T00:00:00.000Z",
      preview: "",
      updatedAt: "2026-03-22T00:00:00.000Z",
    }))

    const createDraft = makeCreateDraftUseCase({
      createDraftId: () => toDraftId(1),
      draftRepository: repository,
      getNow: () => "2026-03-22T00:00:00.000Z",
      promptExists: vi.fn(),
    })

    const result = await createDraft(userId, {})

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().sourcePromptId).toBeNull()
  })

  it("존재하지 않는 프롬프트를 참조하면 NOT_FOUND 에러를 반환한다", async () => {
    const sourcePromptId = toPromptId(3)
    const createDraft = makeCreateDraftUseCase({
      createDraftId: () => toDraftId(99),
      draftRepository: createStubRepository((input) => ({
        ...input,
        createdAt: "2026-03-22T00:00:00.000Z",
        id: toDraftId(11),
        lastSavedAt: "2026-03-22T00:00:00.000Z",
        preview: "",
        updatedAt: "2026-03-22T00:00:00.000Z",
      })),
      getNow: () => "2026-03-22T00:00:00.000Z",
      promptExists: async () => false,
    })

    const result = await createDraft(userId, { sourcePromptId })

    expect(result.isErr()).toBe(true)

    const error = result._unsafeUnwrapErr()
    expect(error).toMatchObject({
      code: "NOT_FOUND",
      entity: "prompt",
      id: sourcePromptId,
    })
  })
})

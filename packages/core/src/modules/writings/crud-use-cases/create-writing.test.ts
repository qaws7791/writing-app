import { describe, expect, it, vi } from "vitest"

import { toWritingId, toPromptId, toUserId } from "../../../shared/brand/index"
import type { WritingDetail, WritingPersistInput } from "../writing-types"
import type { WritingRepository } from "../writing-port"
import { createEmptyWritingContent } from "../../../shared/utilities/writing-content-utilities"
import { makeCreateWritingUseCase } from "./create-writing"

const userId = toUserId("user-1")

function createStubRepository(
  onCreate: (input: WritingPersistInput) => WritingDetail
): WritingRepository {
  return {
    create: async (_userId, input) => onCreate(input),
    delete: async () => ({ kind: "deleted" }),
    getById: async () => ({ kind: "not-found" }),
    list: async () => ({ items: [], nextCursor: null, hasMore: false }),
    replace: async () => ({ kind: "not-found" }),
    resume: async () => null,
  }
}

describe("makeCreateWritingUseCase", () => {
  it("프롬프트 검증 후 글을 생성한다", async () => {
    const sourcePromptId = toPromptId(7)
    const promptExists = vi.fn(async () => true)
    const repository = createStubRepository((input) => ({
      ...input,
      createdAt: "2026-03-22T00:00:00.000Z",
      id: toWritingId(11),
      lastSavedAt: "2026-03-22T00:00:00.000Z",
      preview: input.plainText.slice(0, 100),
      updatedAt: "2026-03-22T00:00:00.000Z",
    }))

    const createWriting = makeCreateWritingUseCase({
      createWritingId: () => toWritingId(99),
      writingRepository: repository,
      getNow: () => "2026-03-22T00:00:00.000Z",
      promptExists,
    })

    const result = await createWriting(userId, {
      sourcePromptId,
      title: "새 글",
    })

    expect(result.isOk()).toBe(true)

    const writing = result._unsafeUnwrap()
    expect(promptExists).toHaveBeenCalledWith(sourcePromptId)
    expect(writing.id).toBe(toWritingId(11))
    expect(writing.title).toBe("새 글")
    expect(writing.content).toEqual(createEmptyWritingContent())
  })

  it("프롬프트 없이 글을 생성한다", async () => {
    const repository = createStubRepository((input) => ({
      ...input,
      createdAt: "2026-03-22T00:00:00.000Z",
      id: toWritingId(1),
      lastSavedAt: "2026-03-22T00:00:00.000Z",
      preview: "",
      updatedAt: "2026-03-22T00:00:00.000Z",
    }))

    const createWriting = makeCreateWritingUseCase({
      createWritingId: () => toWritingId(1),
      writingRepository: repository,
      getNow: () => "2026-03-22T00:00:00.000Z",
      promptExists: vi.fn(),
    })

    const result = await createWriting(userId, {})

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().sourcePromptId).toBeNull()
  })

  it("존재하지 않는 프롬프트를 참조하면 NOT_FOUND 에러를 반환한다", async () => {
    const sourcePromptId = toPromptId(3)
    const createWriting = makeCreateWritingUseCase({
      createWritingId: () => toWritingId(99),
      writingRepository: createStubRepository((input) => ({
        ...input,
        createdAt: "2026-03-22T00:00:00.000Z",
        id: toWritingId(11),
        lastSavedAt: "2026-03-22T00:00:00.000Z",
        preview: "",
        updatedAt: "2026-03-22T00:00:00.000Z",
      })),
      getNow: () => "2026-03-22T00:00:00.000Z",
      promptExists: async () => false,
    })

    const result = await createWriting(userId, { sourcePromptId })

    expect(result.isErr()).toBe(true)

    const error = result._unsafeUnwrapErr()
    expect(error).toMatchObject({
      code: "NOT_FOUND",
      entity: "prompt",
      id: sourcePromptId,
    })
  })
})

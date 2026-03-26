import { describe, expect, it, vi } from "vitest"

import { toWritingId, toPromptId, toUserId } from "../../../shared/brand/index"
import type {
  WritingCrudAccessResult,
  WritingDeleteResult,
  WritingDetail,
  WritingMutationResult,
  WritingPersistInput,
  WritingRepository,
  WritingSummary,
} from "../../../shared/ports/index"
import { createEmptyWritingContent } from "../../../shared/utilities/index"
import { makeCreateWritingUseCase } from "./create-writing-use-case"

const userId = toUserId("user-1")

function createWritingRepositoryStub(
  onCreate: (input: WritingPersistInput) => WritingDetail
) {
  return {
    create: async (_userId, input) => onCreate(input),
    delete: async (): Promise<WritingDeleteResult> => ({ kind: "deleted" }),
    getById: async (): Promise<WritingCrudAccessResult> => ({
      kind: "not-found",
    }),
    list: async (): Promise<readonly WritingSummary[]> => [],
    replace: async (): Promise<WritingMutationResult> => ({
      kind: "not-found",
    }),
    resume: async (): Promise<WritingSummary | null> => null,
  } satisfies WritingRepository
}

describe("makeCreateWritingUseCase", () => {
  it("creates a WritingFull with normalized defaults and prompt validation", async () => {
    const sourcePromptId = toPromptId(7)
    const promptExists = vi.fn(async () => true)
    const repository = createWritingRepositoryStub((input) => ({
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

    expect(promptExists).toHaveBeenCalledWith(sourcePromptId)
    expect("kind" in result ? result.kind : undefined).toBe("success")

    if (!("kind" in result) || result.kind !== "success") {
      throw new Error("expected create WritingFull to succeed")
    }

    expect(result.writing.id).toBe(toWritingId(11))
    expect(result.writing.title).toBe("새 글")
    expect(result.writing.content).toEqual(createEmptyWritingContent())
  })

  it("returns a prompt not found error when the source prompt is missing", async () => {
    const sourcePromptId = toPromptId(3)
    const createWriting = makeCreateWritingUseCase({
      createWritingId: () => toWritingId(99),
      writingRepository: createWritingRepositoryStub((input) => ({
        ...input,
        createdAt: "2026-03-22T00:00:00.000Z",
        id: toWritingId(11),
        lastSavedAt: "2026-03-22T00:00:00.000Z",
        preview: input.plainText.slice(0, 100),
        updatedAt: "2026-03-22T00:00:00.000Z",
      })),
      getNow: () => "2026-03-22T00:00:00.000Z",
      promptExists: async () => false,
    })

    const result = await createWriting(userId, {
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

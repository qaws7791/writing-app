import { describe, expect, it } from "vitest"

import { toPromptId, toUserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../prompt-port"
import { makeSavePromptUseCase } from "./save-prompt"

const userId = toUserId("user-1")

function createStubPromptRepository(
  overrides: Partial<PromptRepository> = {}
): PromptRepository {
  return {
    exists: async () => true,
    getById: async () => null,
    list: async () => [],
    listSaved: async () => [],
    listTodayPrompts: async () => [],
    save: async () => ({ kind: "not-found" }),
    unsave: async () => false,
    ...overrides,
  }
}

describe("makeSavePromptUseCase", () => {
  it("글감을 저장한다", async () => {
    const savedAt = "2026-03-22T00:00:00.000Z"
    const savePrompt = makeSavePromptUseCase({
      promptRepository: createStubPromptRepository({
        save: async () => ({ kind: "saved", savedAt }),
      }),
    })

    const result = await savePrompt(userId, toPromptId(1))

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().savedAt).toBe(savedAt)
  })

  it("존재하지 않는 글감이면 NOT_FOUND를 반환한다", async () => {
    const savePrompt = makeSavePromptUseCase({
      promptRepository: createStubPromptRepository(),
    })

    const result = await savePrompt(userId, toPromptId(999))

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
      entity: "prompt",
    })
  })
})

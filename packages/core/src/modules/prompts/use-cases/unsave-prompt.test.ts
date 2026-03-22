import { describe, expect, it } from "vitest"

import { toPromptId, toUserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../prompt-port"
import { makeUnsavePromptUseCase } from "./unsave-prompt"

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

describe("makeUnsavePromptUseCase", () => {
  it("저장된 글감을 해제한다", async () => {
    const unsavePrompt = makeUnsavePromptUseCase({
      promptRepository: createStubPromptRepository({
        unsave: async () => true,
      }),
    })

    const result = await unsavePrompt(userId, toPromptId(1))

    expect(result.isOk()).toBe(true)
  })

  it("저장되지 않은 글감이면 NOT_FOUND를 반환한다", async () => {
    const unsavePrompt = makeUnsavePromptUseCase({
      promptRepository: createStubPromptRepository({
        unsave: async () => false,
      }),
    })

    const result = await unsavePrompt(userId, toPromptId(999))

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
      entity: "prompt",
    })
  })
})

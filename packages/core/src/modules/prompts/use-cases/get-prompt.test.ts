import { describe, expect, it } from "vitest"

import { toPromptId, toUserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../prompt-port"
import type { PromptDetail } from "../prompt-types"
import { makeGetPromptUseCase } from "./get-prompt"

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

const samplePrompt: PromptDetail = {
  description: "설명",
  id: toPromptId(1),
  level: 1,
  outline: ["항목"],
  saved: false,
  suggestedLengthLabel: "짧음",
  tags: ["태그"],
  text: "테스트 글감",
  tips: ["팁"],
  topic: "자기이해",
}

describe("makeGetPromptUseCase", () => {
  it("글감을 조회한다", async () => {
    const getPrompt = makeGetPromptUseCase({
      promptRepository: createStubPromptRepository({
        getById: async () => samplePrompt,
      }),
    })

    const result = await getPrompt(userId, toPromptId(1))

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().text).toBe("테스트 글감")
  })

  it("글감이 없으면 NOT_FOUND를 반환한다", async () => {
    const getPrompt = makeGetPromptUseCase({
      promptRepository: createStubPromptRepository(),
    })

    const result = await getPrompt(userId, toPromptId(999))

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
      entity: "prompt",
    })
  })
})

import { describe, expect, it } from "vitest"

import { toPromptId, toUserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../prompt-port"
import type { PromptSummary } from "../prompt-types"
import { makeListPromptsUseCase } from "./list-prompts"

const userId = toUserId("user-1")

const samplePrompts: readonly PromptSummary[] = [
  {
    id: toPromptId(1),
    level: 1,
    saved: false,
    suggestedLengthLabel: "짧음",
    tags: ["회고"],
    text: "글감 1",
    topic: "자기이해",
  },
  {
    id: toPromptId(2),
    level: 2,
    saved: true,
    suggestedLengthLabel: "보통",
    tags: ["일상"],
    text: "글감 2",
    topic: "일상",
  },
]

function createStubPromptRepository(
  overrides: Partial<PromptRepository> = {}
): PromptRepository {
  return {
    exists: async () => true,
    getById: async () => null,
    list: async () => samplePrompts,
    listSaved: async () => [],
    listTodayPrompts: async () => [],
    save: async () => ({ kind: "not-found" }),
    unsave: async () => false,
    ...overrides,
  }
}

describe("makeListPromptsUseCase", () => {
  it("글감 목록을 조회한다", async () => {
    const listPrompts = makeListPromptsUseCase({
      promptRepository: createStubPromptRepository(),
    })

    const result = await listPrompts(userId, {})

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toHaveLength(2)
  })

  it("필터를 전달한다", async () => {
    const listFn = async (_u: unknown, filters: unknown) => {
      expect(filters).toMatchObject({ topic: "일상" })
      return samplePrompts.slice(1)
    }

    const listPrompts = makeListPromptsUseCase({
      promptRepository: createStubPromptRepository({ list: listFn as never }),
    })

    const result = await listPrompts(userId, { topic: "일상" })

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toHaveLength(1)
  })
})

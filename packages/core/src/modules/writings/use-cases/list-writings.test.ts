import { describe, expect, it } from "vitest"

import { toUserId } from "../../../shared/brand/index"
import { createFakeWritingRepository } from "../testing/fake-writing-repository"
import { makeListWritingsUseCase } from "./list-writings"

const userId = toUserId("user-1")

describe("makeListWritingsUseCase", () => {
  it("글 목록을 조회한다", async () => {
    const repository = createFakeWritingRepository()
    await repository.create(userId, {
      characterCount: 0,
      content: { content: [{ type: "paragraph" }], type: "doc" },
      plainText: "",
      sourcePromptId: null,
      title: "첫 번째",
      wordCount: 0,
    })
    await repository.create(userId, {
      characterCount: 0,
      content: { content: [{ type: "paragraph" }], type: "doc" },
      plainText: "",
      sourcePromptId: null,
      title: "두 번째",
      wordCount: 0,
    })

    const listWritings = makeListWritingsUseCase({
      writingRepository: repository,
    })
    const result = await listWritings(userId)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().items).toHaveLength(2)
  })

  it("limit를 지정하면 해당 수만큼만 반환한다", async () => {
    const repository = createFakeWritingRepository()
    for (let i = 0; i < 5; i++) {
      await repository.create(userId, {
        characterCount: 0,
        content: { content: [{ type: "paragraph" }], type: "doc" },
        plainText: "",
        sourcePromptId: null,
        title: `글 ${i}`,
        wordCount: 0,
      })
    }

    const listWritings = makeListWritingsUseCase({
      writingRepository: repository,
    })
    const result = await listWritings(userId, { limit: 3 })

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().items).toHaveLength(3)
  })

  it("글이 없으면 빈 배열을 반환한다", async () => {
    const listWritings = makeListWritingsUseCase({
      writingRepository: createFakeWritingRepository(),
    })

    const result = await listWritings(userId)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().items).toHaveLength(0)
  })
})

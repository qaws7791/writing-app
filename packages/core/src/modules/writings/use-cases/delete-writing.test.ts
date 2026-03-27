import { describe, expect, it } from "vitest"

import { toWritingId, toUserId } from "../../../shared/brand/index"
import { createFakeWritingRepository } from "../testing/fake-writing-repository"
import { makeDeleteWritingUseCase } from "./delete-writing"

const userId = toUserId("user-1")

describe("makeDeleteWritingUseCase", () => {
  it("글을 삭제한다", async () => {
    const repository = createFakeWritingRepository()
    await repository.create(userId, {
      characterCount: 0,
      content: { content: [{ type: "paragraph" }], type: "doc" },
      plainText: "",
      sourcePromptId: null,
      title: "삭제할 글",
      wordCount: 0,
    })

    const deleteWriting = makeDeleteWritingUseCase({
      writingRepository: repository,
    })
    const result = await deleteWriting(userId, toWritingId(1))

    expect(result.isOk()).toBe(true)
  })

  it("존재하지 않는 글 삭제를 시도하면 NOT_FOUND를 반환한다", async () => {
    const deleteWriting = makeDeleteWritingUseCase({
      writingRepository: createFakeWritingRepository(),
    })

    const result = await deleteWriting(userId, toWritingId(999))

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
      entity: "writing",
    })
  })
})

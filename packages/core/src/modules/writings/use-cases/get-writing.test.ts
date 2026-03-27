import { describe, expect, it } from "vitest"

import { toWritingId, toUserId } from "../../../shared/brand/index"
import { createFakeWritingRepository } from "../testing/fake-writing-repositories"
import { makeGetWritingUseCase } from "./get-writing"

const userId = toUserId("user-1")

describe("makeGetWritingUseCase", () => {
  it("글을 조회한다", async () => {
    const repository = createFakeWritingRepository()
    const created = await repository.create(userId, {
      characterCount: 4,
      content: { content: [{ type: "paragraph" }], type: "doc" },
      plainText: "글 내용",
      sourcePromptId: null,
      title: "테스트 글",
      wordCount: 2,
    })

    const getWriting = makeGetWritingUseCase({ writingRepository: repository })
    const result = await getWriting(userId, created.id)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().title).toBe("테스트 글")
  })

  it("존재하지 않는 글이면 NOT_FOUND를 반환한다", async () => {
    const getWriting = makeGetWritingUseCase({
      writingRepository: createFakeWritingRepository(),
    })

    const result = await getWriting(userId, toWritingId(999))

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
      entity: "writing",
    })
  })
})

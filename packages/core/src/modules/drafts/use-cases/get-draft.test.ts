import { describe, expect, it } from "vitest"

import { toDraftId, toUserId } from "../../../shared/brand/index"
import { createFakeDraftRepository } from "../testing/fake-draft-repository"
import { makeGetDraftUseCase } from "./get-draft"

const userId = toUserId("user-1")

describe("makeGetDraftUseCase", () => {
  it("초안을 조회한다", async () => {
    const repository = createFakeDraftRepository()
    const created = await repository.create(userId, {
      characterCount: 4,
      content: { content: [{ type: "paragraph" }], type: "doc" },
      plainText: "초안 내용",
      sourcePromptId: null,
      title: "테스트 초안",
      wordCount: 2,
    })

    const getDraft = makeGetDraftUseCase({ draftRepository: repository })
    const result = await getDraft(userId, created.id)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().title).toBe("테스트 초안")
  })

  it("존재하지 않는 초안이면 NOT_FOUND를 반환한다", async () => {
    const getDraft = makeGetDraftUseCase({
      draftRepository: createFakeDraftRepository(),
    })

    const result = await getDraft(userId, toDraftId(999))

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
      entity: "draft",
    })
  })
})

import { describe, expect, it } from "vitest"

import { toDraftId, toUserId } from "../../../shared/brand/index"
import { createFakeDraftRepository } from "../testing/fake-draft-repository"
import { makeDeleteDraftUseCase } from "./delete-draft"

const userId = toUserId("user-1")

describe("makeDeleteDraftUseCase", () => {
  it("초안을 삭제한다", async () => {
    const repository = createFakeDraftRepository()
    await repository.create(userId, {
      characterCount: 0,
      content: { content: [{ type: "paragraph" }], type: "doc" },
      plainText: "",
      sourcePromptId: null,
      title: "삭제할 초안",
      wordCount: 0,
    })

    const deleteDraft = makeDeleteDraftUseCase({ draftRepository: repository })
    const result = await deleteDraft(userId, toDraftId(1))

    expect(result.isOk()).toBe(true)
  })

  it("존재하지 않는 초안 삭제를 시도하면 NOT_FOUND를 반환한다", async () => {
    const deleteDraft = makeDeleteDraftUseCase({
      draftRepository: createFakeDraftRepository(),
    })

    const result = await deleteDraft(userId, toDraftId(999))

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
      entity: "draft",
    })
  })
})

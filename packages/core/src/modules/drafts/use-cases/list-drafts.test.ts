import { describe, expect, it } from "vitest"

import { toUserId } from "../../../shared/brand/index"
import { createFakeDraftRepository } from "../testing/fake-draft-repository"
import { makeListDraftsUseCase } from "./list-drafts"

const userId = toUserId("user-1")

describe("makeListDraftsUseCase", () => {
  it("초안 목록을 조회한다", async () => {
    const repository = createFakeDraftRepository()
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

    const listDrafts = makeListDraftsUseCase({ draftRepository: repository })
    const result = await listDrafts(userId)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toHaveLength(2)
  })

  it("limit를 지정하면 해당 수만큼만 반환한다", async () => {
    const repository = createFakeDraftRepository()
    for (let i = 0; i < 5; i++) {
      await repository.create(userId, {
        characterCount: 0,
        content: { content: [{ type: "paragraph" }], type: "doc" },
        plainText: "",
        sourcePromptId: null,
        title: `초안 ${i}`,
        wordCount: 0,
      })
    }

    const listDrafts = makeListDraftsUseCase({ draftRepository: repository })
    const result = await listDrafts(userId, 3)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toHaveLength(3)
  })

  it("초안이 없으면 빈 배열을 반환한다", async () => {
    const listDrafts = makeListDraftsUseCase({
      draftRepository: createFakeDraftRepository(),
    })

    const result = await listDrafts(userId)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toHaveLength(0)
  })
})

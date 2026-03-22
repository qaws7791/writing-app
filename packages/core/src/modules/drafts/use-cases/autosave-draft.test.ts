import { describe, expect, it } from "vitest"

import { toDraftId, toUserId } from "../../../shared/brand/index"
import type { DraftContent } from "../../../shared/schema/index"
import { createFakeDraftRepository } from "../testing/fake-draft-repository"
import { makeAutosaveDraftUseCase } from "./autosave-draft"

const userId = toUserId("user-1")

const updatedContent: DraftContent = {
  content: [
    {
      content: [{ text: "업데이트된 본문입니다.", type: "text" }],
      type: "paragraph",
    },
  ],
  type: "doc",
}

describe("makeAutosaveDraftUseCase", () => {
  it("변경 사항이 없으면 VALIDATION_ERROR를 반환한다", async () => {
    const autosaveDraft = makeAutosaveDraftUseCase({
      draftRepository: createFakeDraftRepository(),
      getNow: () => "2026-03-22T00:00:00.000Z",
    })

    const result = await autosaveDraft(userId, toDraftId(1), {})

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "VALIDATION_ERROR",
      field: "draft",
    })
  })

  it("초안 제목과 본문을 업데이트한다", async () => {
    const repository = createFakeDraftRepository()
    const createdDraft = await repository.create(userId, {
      characterCount: 4,
      content: { content: [{ type: "paragraph" }], type: "doc" },
      plainText: "초안",
      sourcePromptId: null,
      title: "이전 제목",
      wordCount: 1,
    })

    const autosaveDraft = makeAutosaveDraftUseCase({
      draftRepository: repository,
      getNow: () => "2026-03-22T12:00:00.000Z",
    })

    const result = await autosaveDraft(userId, createdDraft.id, {
      content: updatedContent,
      title: "새 제목",
    })

    expect(result.isOk()).toBe(true)

    const draft = result._unsafeUnwrap()
    expect(draft.title).toBe("새 제목")
    expect(draft.content).toEqual(updatedContent)
    expect(draft.wordCount).toBe(2)
    expect(draft.characterCount).toBe("업데이트된 본문입니다.".length)
  })

  it("존재하지 않는 초안이면 NOT_FOUND 에러를 반환한다", async () => {
    const autosaveDraft = makeAutosaveDraftUseCase({
      draftRepository: createFakeDraftRepository(),
      getNow: () => "2026-03-22T00:00:00.000Z",
    })

    const result = await autosaveDraft(userId, toDraftId(999), {
      title: "새 제목",
    })

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
      entity: "draft",
    })
  })
})

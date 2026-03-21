import { describe, expect, it } from "vitest"

import { toDraftId, toUserId } from "../../../shared/brand/index"
import type { DraftContent } from "../../../shared/schema/index"
import { FakeDraftRepository } from "../../../shared/testing/index"
import { makeAutosaveDraftUseCase } from "./autosave-draft-use-case"

const userId = toUserId("user-1")

const updatedContent: DraftContent = {
  content: [
    {
      content: [
        {
          text: "업데이트된 본문입니다.",
          type: "text",
        },
      ],
      type: "paragraph",
    },
  ],
  type: "doc",
}

describe("makeAutosaveDraftUseCase", () => {
  it("returns a validation error when nothing changed", async () => {
    const autosaveDraft = makeAutosaveDraftUseCase({
      draftRepository: new FakeDraftRepository(),
      getNow: () => "2026-03-22T00:00:00.000Z",
    })

    const result = await autosaveDraft(userId, toDraftId(1), {})

    expect(result).toMatchObject({
      code: "VALIDATION_ERROR",
      field: "draft",
      message: "변경할 제목 또는 본문이 필요합니다.",
    })
  })

  it("updates the persisted draft content and title", async () => {
    const repository = new FakeDraftRepository()
    const createdDraft = await repository.create(userId, {
      characterCount: 4,
      content: {
        content: [{ type: "paragraph" }],
        type: "doc",
      },
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

    expect("kind" in result ? result.kind : undefined).toBe("success")

    if (!("kind" in result) || result.kind !== "success") {
      throw new Error("expected autosave to succeed")
    }

    expect(result.draft.title).toBe("새 제목")
    expect(result.draft.content).toEqual(updatedContent)
    expect(result.draft.wordCount).toBe(2)
    expect(result.draft.characterCount).toBe("업데이트된 본문입니다.".length)
  })
})

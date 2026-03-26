import { describe, expect, it } from "vitest"

import { toWritingId, toUserId } from "../../../shared/brand/index"
import type { WritingContent } from "../../../shared/schema/index"
import { createFakeWritingRepository } from "../crud-testing/index"
import { makeAutosaveWritingUseCase } from "./autosave-writing-use-case"

const userId = toUserId("user-1")

const updatedContent: WritingContent = {
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

describe("makeAutosaveWritingUseCase", () => {
  it("returns a validation error when nothing changed", async () => {
    const autosaveWriting = makeAutosaveWritingUseCase({
      writingRepository: createFakeWritingRepository(),
      getNow: () => "2026-03-22T00:00:00.000Z",
    })

    const result = await autosaveWriting(userId, toWritingId(1), {})

    expect(result).toMatchObject({
      code: "VALIDATION_ERROR",
      field: "writing",
      message: "변경할 제목 또는 본문이 필요합니다.",
    })
  })

  it("updates the persisted WritingFull content and title", async () => {
    const repository = createFakeWritingRepository()
    const createdWriting = await repository.create(userId, {
      characterCount: 4,
      content: {
        content: [{ type: "paragraph" }],
        type: "doc",
      },
      plainText: "글",
      sourcePromptId: null,
      title: "이전 제목",
      wordCount: 1,
    })

    const autosaveWriting = makeAutosaveWritingUseCase({
      writingRepository: repository,
      getNow: () => "2026-03-22T12:00:00.000Z",
    })

    const result = await autosaveWriting(userId, createdWriting.id, {
      content: updatedContent,
      title: "새 제목",
    })

    expect("kind" in result ? result.kind : undefined).toBe("success")

    if (!("kind" in result) || result.kind !== "success") {
      throw new Error("expected autosave to succeed")
    }

    expect(result.writing.title).toBe("새 제목")
    expect(result.writing.content).toEqual(updatedContent)
    expect(result.writing.wordCount).toBe(2)
    expect(result.writing.characterCount).toBe("업데이트된 본문입니다.".length)
  })
})

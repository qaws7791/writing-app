import { describe, expect, it } from "vitest"

import { toWritingId, toUserId } from "../../../shared/brand/index"
import type { WritingContent } from "../../../shared/schema/index"
import { createFakeWritingRepository } from "../testing/fake-writing-repository"
import { makeAutosaveWritingUseCase } from "./autosave-writing"

const userId = toUserId("user-1")

const updatedContent: WritingContent = {
  content: [
    {
      content: [{ text: "업데이트된 본문입니다.", type: "text" }],
      type: "paragraph",
    },
  ],
  type: "doc",
}

describe("makeAutosaveWritingUseCase", () => {
  it("변경 사항이 없으면 VALIDATION_ERROR를 반환한다", async () => {
    const autosaveWriting = makeAutosaveWritingUseCase({
      writingRepository: createFakeWritingRepository(),
      getNow: () => "2026-03-22T00:00:00.000Z",
    })

    const result = await autosaveWriting(userId, toWritingId(1), {})

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "VALIDATION_ERROR",
      field: "writing",
    })
  })

  it("글 제목과 본문을 업데이트한다", async () => {
    const repository = createFakeWritingRepository()
    const createdWriting = await repository.create(userId, {
      characterCount: 4,
      content: { content: [{ type: "paragraph" }], type: "doc" },
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

    expect(result.isOk()).toBe(true)

    const writing = result._unsafeUnwrap()
    expect(writing.title).toBe("새 제목")
    expect(writing.content).toEqual(updatedContent)
    expect(writing.wordCount).toBe(2)
    expect(writing.characterCount).toBe("업데이트된 본문입니다.".length)
  })

  it("존재하지 않는 글이면 NOT_FOUND 에러를 반환한다", async () => {
    const autosaveWriting = makeAutosaveWritingUseCase({
      writingRepository: createFakeWritingRepository(),
      getNow: () => "2026-03-22T00:00:00.000Z",
    })

    const result = await autosaveWriting(userId, toWritingId(999), {
      title: "새 제목",
    })

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
      entity: "writing",
    })
  })
})

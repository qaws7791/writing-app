import { describe, expect, it } from "vitest"

import { toWritingId, toPromptId } from "../../shared/brand/index"
import type { WritingContent } from "../../shared/schema/index"
import {
  buildWriting,
  createPreview,
  updateWritingContent,
  updateWritingTitle,
} from "./writing-operations"
import { createTestWriting } from "./crud-testing/writing-fixture"

const now = "2026-03-22T00:00:00.000Z"

describe("createPreview", () => {
  it("100자 이하일 때 그대로 반환한다", () => {
    expect(createPreview("짧은 텍스트")).toBe("짧은 텍스트")
  })

  it("100자를 초과하면 잘라낸다", () => {
    const longText = "가".repeat(150)
    expect(createPreview(longText)).toBe("가".repeat(100))
  })

  it("maxLength를 지정하면 해당 길이로 잘라낸다", () => {
    expect(createPreview("12345", 3)).toBe("123")
  })
})

describe("buildWriting", () => {
  it("입력값으로 Writing을 생성한다", () => {
    const content: WritingContent = {
      content: [
        {
          content: [{ text: "안녕하세요", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    }
    const promptId = toPromptId(1)

    const writing = buildWriting(toWritingId(1), "제목", content, promptId, now)

    expect(writing.id).toBe(toWritingId(1))
    expect(writing.title).toBe("제목")
    expect(writing.content).toEqual(content)
    expect(writing.sourcePromptId).toBe(promptId)
    expect(writing.createdAt).toBe(now)
    expect(writing.updatedAt).toBe(now)
    expect(writing.wordCount).toBeGreaterThanOrEqual(1)
    expect(writing.characterCount).toBeGreaterThanOrEqual(5)
  })
})

describe("updateWritingContent", () => {
  it("본문을 업데이트하고 메트릭스를 다시 계산한다", () => {
    const writing = createTestWriting({ plainText: "이전" })
    const newContent: WritingContent = {
      content: [
        {
          content: [{ text: "새로운 본문입니다", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    }

    const updated = updateWritingContent(writing, newContent, now)

    expect(updated.content).toEqual(newContent)
    expect(updated.updatedAt).toBe(now)
    expect(updated.characterCount).toBeGreaterThan(0)
  })
})

describe("updateWritingTitle", () => {
  it("제목을 업데이트한다", () => {
    const writing = createTestWriting({ title: "이전 제목" })

    const updated = updateWritingTitle(writing, "새 제목", now)

    expect(updated.title).toBe("새 제목")
    expect(updated.updatedAt).toBe(now)
  })

  it("다른 필드는 변경하지 않는다", () => {
    const writing = createTestWriting({ plainText: "본문", title: "이전" })

    const updated = updateWritingTitle(writing, "새 제목", now)

    expect(updated.content).toEqual(writing.content)
    expect(updated.sourcePromptId).toEqual(writing.sourcePromptId)
  })
})

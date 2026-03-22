import { describe, expect, it } from "vitest"

import { toDraftId, toPromptId } from "../../shared/brand/index"
import type { DraftContent } from "../../shared/schema/index"
import {
  buildDraft,
  createPreview,
  updateDraftContent,
  updateDraftTitle,
} from "./draft-operations"
import { createTestDraft } from "./testing/draft-fixture"

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

describe("buildDraft", () => {
  it("입력값으로 Draft를 생성한다", () => {
    const content: DraftContent = {
      content: [
        {
          content: [{ text: "안녕하세요", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    }
    const promptId = toPromptId(1)

    const draft = buildDraft(toDraftId(1), "제목", content, promptId, now)

    expect(draft.id).toBe(toDraftId(1))
    expect(draft.title).toBe("제목")
    expect(draft.content).toEqual(content)
    expect(draft.sourcePromptId).toBe(promptId)
    expect(draft.createdAt).toBe(now)
    expect(draft.updatedAt).toBe(now)
    expect(draft.wordCount).toBeGreaterThanOrEqual(1)
    expect(draft.characterCount).toBeGreaterThanOrEqual(5)
  })
})

describe("updateDraftContent", () => {
  it("본문을 업데이트하고 메트릭스를 다시 계산한다", () => {
    const draft = createTestDraft({ plainText: "이전" })
    const newContent: DraftContent = {
      content: [
        {
          content: [{ text: "새로운 본문입니다", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    }

    const updated = updateDraftContent(draft, newContent, now)

    expect(updated.content).toEqual(newContent)
    expect(updated.updatedAt).toBe(now)
    expect(updated.characterCount).toBeGreaterThan(0)
  })
})

describe("updateDraftTitle", () => {
  it("제목을 업데이트한다", () => {
    const draft = createTestDraft({ title: "이전 제목" })

    const updated = updateDraftTitle(draft, "새 제목", now)

    expect(updated.title).toBe("새 제목")
    expect(updated.updatedAt).toBe(now)
  })

  it("다른 필드는 변경하지 않는다", () => {
    const draft = createTestDraft({ plainText: "본문", title: "이전" })

    const updated = updateDraftTitle(draft, "새 제목", now)

    expect(updated.content).toEqual(draft.content)
    expect(updated.sourcePromptId).toEqual(draft.sourcePromptId)
  })
})

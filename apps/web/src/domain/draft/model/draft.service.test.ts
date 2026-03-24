import {
  createEmptyDraftContent,
  draftContentToHtml,
  draftContentToPlainText,
  getDraftMetrics,
} from "./draft.service"

describe("phase one rich text helpers", () => {
  test("creates an empty paragraph document", () => {
    expect(createEmptyDraftContent()).toEqual({
      content: [{ type: "paragraph" }],
      type: "doc",
    })
  })

  test("converts structured content to plain text and html", () => {
    const content = {
      content: [
        {
          content: [{ text: "굵게", type: "text", marks: [{ type: "bold" }] }],
          type: "paragraph",
        },
        {
          content: [{ text: "인용", type: "text" }],
          type: "blockquote",
        },
      ],
      type: "doc" as const,
    }

    expect(draftContentToPlainText(content)).toBe("굵게\n인용")
    expect(draftContentToHtml(content)).toContain("<strong>굵게</strong>")
    expect(draftContentToHtml(content)).toContain(
      "<blockquote>인용</blockquote>"
    )
  })

  test("derives preview and metrics from content", () => {
    const metrics = getDraftMetrics({
      content: [
        {
          content: [{ text: "첫 문장 입니다", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    })

    expect(metrics.plainText).toBe("첫 문장 입니다")
    expect(metrics.characterCount).toBe(8)
    expect(metrics.wordCount).toBe(3)
    expect(metrics.preview).toBe("첫 문장 입니다")
  })
})

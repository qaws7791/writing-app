import {
  createEmptyDraftContent,
  draftContentSchema,
  extractDraftTextMetrics,
} from "./content.js"

describe("draft content schema", () => {
  test("accepts nested attrs and marks", () => {
    const result = draftContentSchema.safeParse({
      content: [
        {
          attrs: {
            align: "left",
            metadata: {
              emphasis: true,
            },
          },
          content: [
            {
              marks: [
                {
                  attrs: {
                    level: 1,
                  },
                  type: "bold",
                },
              ],
              text: "중첩 구조",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    })

    expect(result.success).toBe(true)
  })

  test("rejects unknown node properties", () => {
    const result = draftContentSchema.safeParse({
      content: [
        {
          invalid: true,
          type: "paragraph",
        },
      ],
      type: "doc",
    })

    expect(result.success).toBe(false)
  })

  test("rejects unknown mark properties", () => {
    const result = draftContentSchema.safeParse({
      content: [
        {
          content: [
            {
              marks: [
                {
                  type: "bold",
                  unexpected: "x",
                },
              ],
              text: "mark",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    })

    expect(result.success).toBe(false)
  })
})

describe("draft content helpers", () => {
  test("creates a paragraph-only empty document", () => {
    expect(createEmptyDraftContent()).toEqual({
      content: [{ type: "paragraph" }],
      type: "doc",
    })
  })

  test("normalizes extra blank lines and counts words", () => {
    const metrics = extractDraftTextMetrics({
      content: [
        {
          content: [{ text: "첫 문장", type: "text" }],
          type: "paragraph",
        },
        {
          type: "paragraph",
        },
        {
          content: [{ text: "둘째 문장 입니다", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    })

    expect(metrics.plainText).toBe("첫 문장\n\n둘째 문장 입니다")
    expect(metrics.characterCount).toBe(metrics.plainText.length)
    expect(metrics.wordCount).toBe(5)
  })

  test("returns zero metrics for empty content", () => {
    const metrics = extractDraftTextMetrics({
      content: [{ type: "paragraph" }],
      type: "doc",
    })

    expect(metrics).toEqual({
      characterCount: 0,
      plainText: "",
      wordCount: 0,
    })
  })
})

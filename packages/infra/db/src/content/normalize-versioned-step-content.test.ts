import { describe, expect, it } from "vitest"

import { normalizeVersionedStepContent } from "#db/content/normalize-versioned-step-content"

describe("버전 콘텐츠 선택 항목 ID 정규화", () => {
  it.each([
    [
      "FILL_BLANK",
      { words: ["하나", "둘"] },
      "wordIds",
      ["step-1:word:1", "step-1:word:2"],
    ],
    [
      "SELECT",
      { segments: ["하나", "둘"] },
      "segmentIds",
      ["step-1:segment:1", "step-1:segment:2"],
    ],
    [
      "ORDER",
      { items: ["하나", "둘"] },
      "itemIds",
      ["step-1:item:1", "step-1:item:2"],
    ],
  ] as const)(
    "%s 배열에 결정적 ID를 채운다",
    (stepType, content, idField, expectedIds) => {
      const first = normalizeVersionedStepContent(
        "step-1",
        stepType,
        JSON.stringify(content)
      )
      const second = normalizeVersionedStepContent("step-1", stepType, first)

      expect(JSON.parse(first)).toMatchObject({ [idField]: expectedIds })
      expect(second).toBe(first)
    }
  )

  it("객체형 선택 항목의 기존 ID는 보존하고 누락 ID만 채운다", () => {
    const multipleChoice = JSON.parse(
      normalizeVersionedStepContent(
        "choice-step",
        "MULTIPLE_CHOICE",
        JSON.stringify({
          correct: "정답",
          options: [{ id: "kept", text: "오답" }, { text: "정답" }],
        })
      )
    ) as {
      readonly correct: string
      readonly options: readonly { readonly id: string }[]
    }
    const match = JSON.parse(
      normalizeVersionedStepContent(
        "match-step",
        "MATCH",
        JSON.stringify({ pairs: [{ left: "왼쪽", right: "오른쪽" }] })
      )
    ) as {
      readonly pairs: readonly {
        readonly leftId: string
        readonly rightId: string
      }[]
    }

    expect(multipleChoice).toEqual({
      correct: "choice-step:option:2",
      options: [
        { id: "kept", text: "오답" },
        { id: "choice-step:option:2", text: "정답" },
      ],
    })
    expect(match.pairs[0]).toMatchObject({
      leftId: "match-step:left:1",
      rightId: "match-step:right:1",
    })
  })
})

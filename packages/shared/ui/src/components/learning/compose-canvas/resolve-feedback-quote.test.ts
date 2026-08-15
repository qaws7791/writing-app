import { describe, expect, it } from "vitest"

import {
  resolveComposeFeedbackQuote,
  toComposeFeedbackMarks,
} from "./resolve-feedback-quote"

describe("resolveComposeFeedbackQuote", () => {
  const body = "첫 문장입니다. 반대하는 사람도 있다. 마지막."

  it("본문에 있는 quote를 쓴다", () => {
    expect(
      resolveComposeFeedbackQuote({
        body,
        location: "둘째 문단",
        quote: "반대하는 사람도 있다.",
      })
    ).toBe("반대하는 사람도 있다.")
  })

  it("quote가 없으면 location이 본문 부분 문자열일 때 쓴다", () => {
    expect(
      resolveComposeFeedbackQuote({
        body,
        location: "반대하는 사람도 있다.",
      })
    ).toBe("반대하는 사람도 있다.")
  })

  it("본문에 없으면 null이다", () => {
    expect(
      resolveComposeFeedbackQuote({
        body,
        location: "둘째 문단",
        quote: "없는 구절",
      })
    ).toBeNull()
  })
})

describe("toComposeFeedbackMarks", () => {
  it("숨긴 항목과 없는 인용은 빼다", () => {
    expect(
      toComposeFeedbackMarks({
        body: "반대하는 사람도 있다.",
        dismissedIds: new Set(["revision-1"]),
        revisions: [
          {
            example: "예를 붙입니다.",
            location: "반론",
            quote: "반대하는 사람도 있다.",
            reason: "구체화가 필요합니다.",
          },
          {
            example: "나누어 씁니다.",
            location: "만연",
            quote: "없는 문장",
            reason: "한 문장이 깁니다.",
          },
        ],
      })
    ).toEqual([
      {
        example: "예를 붙입니다.",
        id: "revision-0",
        quote: "반대하는 사람도 있다.",
        reason: "구체화가 필요합니다.",
        title: "반론",
      },
    ])
  })
})

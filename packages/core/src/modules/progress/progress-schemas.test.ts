import { describe, expect, it } from "vitest"

import { stepResponseMapSchema, stepResponseSchema } from "./progress-schemas"

describe("stepResponseSchema", () => {
  it("7개 상호작용 응답 variant를 파싱한다", () => {
    expect(
      stepResponseSchema.parse({
        type: "MULTIPLE_CHOICE",
        selected: ["a"],
      })
    ).toEqual({
      type: "MULTIPLE_CHOICE",
      selected: ["a"],
    })

    expect(
      stepResponseSchema.parse({
        type: "FILL_IN_THE_BLANK",
        selections: { blank1: "a" },
      })
    ).toEqual({
      type: "FILL_IN_THE_BLANK",
      selections: { blank1: "a" },
    })

    expect(
      stepResponseSchema.parse({
        type: "ORDERING",
        order: ["a", "b"],
      })
    ).toEqual({
      type: "ORDERING",
      order: ["a", "b"],
    })

    expect(
      stepResponseSchema.parse({
        type: "HIGHLIGHT",
        selected: ["range-1"],
      })
    ).toEqual({
      type: "HIGHLIGHT",
      selected: ["range-1"],
    })

    expect(
      stepResponseSchema.parse({
        type: "SHORT_ANSWER",
        text: "짧은 답변",
      })
    ).toEqual({
      type: "SHORT_ANSWER",
      text: "짧은 답변",
    })

    expect(
      stepResponseSchema.parse({
        type: "WRITING",
        text: "글 내용",
      })
    ).toEqual({
      type: "WRITING",
      text: "글 내용",
    })

    expect(
      stepResponseSchema.parse({
        type: "REWRITING",
        text: "수정 글",
      })
    ).toEqual({
      type: "REWRITING",
      text: "수정 글",
    })
  })

  it("UI 플래그와 AI 상태 shape를 거부한다", () => {
    expect(() =>
      stepResponseSchema.parse({
        type: "WRITING",
        text: "글 내용",
        hasInput: true,
      })
    ).toThrow()

    expect(() =>
      stepResponseSchema.parse({
        kind: "feedback",
        status: "succeeded",
        resultJson: null,
      })
    ).toThrow()
  })
})

describe("stepResponseMapSchema", () => {
  it("step id를 키로 사용하는 응답 맵을 파싱한다", () => {
    expect(
      stepResponseMapSchema.parse({
        "4": {
          type: "WRITING",
          text: "초안",
        },
        "6": {
          type: "REWRITING",
          text: "퇴고본",
        },
      })
    ).toEqual({
      "4": {
        type: "WRITING",
        text: "초안",
      },
      "6": {
        type: "REWRITING",
        text: "퇴고본",
      },
    })
  })
})

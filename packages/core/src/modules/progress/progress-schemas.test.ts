import { describe, expect, it } from "vitest"

import {
  sessionAiResultSchema,
  stepResponseMapSchema,
  stepResponseSchema,
} from "./progress-schemas"

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

describe("sessionAiResultSchema", () => {
  it("피드백과 비교 분석 결과를 파싱한다", () => {
    expect(
      sessionAiResultSchema.parse({
        strengths: ["도입이 선명합니다."],
        improvements: ["근거를 더 보강해 보세요."],
        question: "독자가 가장 궁금해할 지점은 어디인가요?",
      })
    ).toEqual({
      strengths: ["도입이 선명합니다."],
      improvements: ["근거를 더 보강해 보세요."],
      question: "독자가 가장 궁금해할 지점은 어디인가요?",
    })

    expect(
      sessionAiResultSchema.parse({
        improvements: ["문단 연결이 자연스러워졌습니다."],
        summary: "수정본이 더 명확합니다.",
      })
    ).toEqual({
      improvements: ["문단 연결이 자연스러워졌습니다."],
      summary: "수정본이 더 명확합니다.",
    })
  })

  it("필수 필드 누락과 잘못된 타입을 거부한다", () => {
    expect(() =>
      sessionAiResultSchema.parse({
        strengths: ["강점"],
        improvements: ["개선점"],
      })
    ).toThrow()

    expect(() =>
      sessionAiResultSchema.parse({
        improvements: "문자열",
        summary: "요약",
      })
    ).toThrow()

    expect(() =>
      sessionAiResultSchema.parse({
        foo: "bar",
      })
    ).toThrow()
  })
})

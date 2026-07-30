import { describe, expect, it } from "vitest"

import { createAiFeedbackPrompt } from "#ai-feedback/domain/ai-feedback-prompt"

describe("AI feedback prompt policy", () => {
  it("레슨 제목·coaching 초점·학습자 답변만으로 prompt input을 구성한다", () => {
    const prompt = createAiFeedbackPrompt({
      answer: "나는 매일 문장을 고친다.",
      focus: "명확성",
      lessonTitle: "좋은 문장이란 무엇인가",
    })

    expect(prompt.input).toBe(
      [
        "레슨 제목: 좋은 문장이란 무엇인가",
        "코칭 초점: 명확성",
        "학습자 답변:",
        "나는 매일 문장을 고친다.",
      ].join("\n")
    )
  })
})

import { describe, expect, it } from "vitest"

import {
  aiFeedbackPromptPolicyVersion,
  createAiFeedbackPrompt,
} from "#ai-feedback/domain/ai-feedback-prompt"

describe("AI feedback prompt policy", () => {
  it("provider에는 레슨 제목, coaching 초점과 대상 답변만 전달한다", () => {
    const prompt = createAiFeedbackPrompt({
      answer: "나는 매일 문장을 고친다.",
      focus: "명확성",
      lessonTitle: "좋은 문장이란 무엇인가",
    })

    expect(prompt).toEqual({
      input: [
        "레슨 제목: 좋은 문장이란 무엇인가",
        "코칭 초점: 명확성",
        "학습자 답변:",
        "나는 매일 문장을 고친다.",
      ].join("\n"),
      instructions: expect.stringContaining("한국어 글쓰기 학습자"),
      policyVersion: aiFeedbackPromptPolicyVersion,
    })
    expect(JSON.stringify(prompt)).not.toContain("learnerId")
    expect(JSON.stringify(prompt)).not.toContain("curriculumVersionId")
    expect(JSON.stringify(prompt)).not.toContain("idempotencyKey")
    expect(prompt.instructions).not.toContain("점수")
  })
})

import { describe, expect, it } from "vitest"

import {
  aiFeedbackPromptPolicyVersion,
  createAiFeedbackPrompt,
} from "@/modules/ai-feedback/domain/ai-feedback.prompt"

describe("AI 피드백 프롬프트 정책", () => {
  it("AI 코칭 요청을 provider 독립적인 프롬프트로 만든다", () => {
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
      instructions: [
        "당신은 한국어 글쓰기 학습자를 돕는 코치입니다.",
        "답변은 반드시 JSON schema에 맞춰 한국어로 작성합니다.",
        "칭찬은 구체적으로, 개선점은 다음 시도에서 바로 적용할 수 있게 씁니다.",
        "점수는 0부터 100 사이 정수로 판단합니다.",
      ].join("\n"),
      policyVersion: aiFeedbackPromptPolicyVersion,
    })
  })
})

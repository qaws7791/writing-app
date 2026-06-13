import { describe, expect, it } from "vitest"

import {
  createOpenAiFeedbackProvider,
  createUnavailableAiFeedbackProvider,
  type OpenAiResponseCreateRequest,
} from "@/openai/openai-feedback-provider"

describe("OpenAI AI feedback provider", () => {
  it("Responses API 출력 JSON을 AI feedback payload로 변환한다", async () => {
    const requests: OpenAiResponseCreateRequest[] = []
    const provider = createOpenAiFeedbackProvider({
      client: {
        responses: {
          async create(request) {
            requests.push(request)

            return {
              output_text: JSON.stringify({
                improvements: ["근거를 더 구체화하세요."],
                nextAction: "예시 한 문장을 덧붙이세요.",
                score: 88,
                scoreRange: [0, 100],
                showScore: true,
                strengths: ["주장이 앞에 있어 읽기 쉽습니다."],
                summary: "핵심이 선명한 답변입니다.",
              }),
            }
          },
        },
      },
      model: "gpt-5.2",
    })

    await expect(
      provider.createFeedback({
        answer: "나는 매일 조금씩 문장을 고친다.",
        focus: "명확성",
        lessonTitle: "좋은 문장이란 무엇인가",
      })
    ).resolves.toEqual({
      kind: "ok",
      value: {
        improvements: ["근거를 더 구체화하세요."],
        nextAction: "예시 한 문장을 덧붙이세요.",
        score: 88,
        scoreRange: [0, 100],
        showScore: true,
        strengths: ["주장이 앞에 있어 읽기 쉽습니다."],
        summary: "핵심이 선명한 답변입니다.",
      },
    })

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      model: "gpt-5.2",
      text: {
        format: {
          name: "kwep_ai_feedback",
          strict: true,
          type: "json_schema",
        },
      },
    })
    expect(requests[0]?.input).toContain("좋은 문장이란 무엇인가")
    expect(requests[0]?.input).toContain("명확성")
    expect(requests[0]?.input).toContain("나는 매일 조금씩 문장을 고친다.")
  })

  it("OpenAI 호출 또는 응답 파싱 실패를 provider-unavailable로 반환한다", async () => {
    const provider = createOpenAiFeedbackProvider({
      client: {
        responses: {
          async create() {
            return {
              output_text: "not-json",
            }
          },
        },
      },
      model: "gpt-5.2",
    })

    await expect(
      provider.createFeedback({
        answer: "초안입니다.",
        focus: "명확성",
        lessonTitle: "좋은 문장이란 무엇인가",
      })
    ).resolves.toEqual({
      error: {
        kind: "provider-unavailable",
      },
      kind: "err",
    })
  })

  it("API key가 없는 실행 환경에서는 unavailable provider를 사용한다", async () => {
    const provider = createUnavailableAiFeedbackProvider()

    await expect(
      provider.createFeedback({
        answer: "초안입니다.",
        focus: "명확성",
        lessonTitle: "좋은 문장이란 무엇인가",
      })
    ).resolves.toEqual({
      error: {
        kind: "provider-unavailable",
      },
      kind: "err",
    })
  })
})

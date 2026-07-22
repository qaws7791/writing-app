import { describe, expect, it } from "vitest"
import { err, ok } from "@workspace/kernel/result"

import { createAiFeedbackPrompt } from "#ai-feedback/domain/ai-feedback-prompt"
import {
  createConfiguredAiFeedbackProvider,
  createOpenAiFeedbackProvider,
  type OpenAiResponseCreateRequest,
} from "#ai-feedback/infrastructure/adapters/openai-feedback-provider"

const prompt = createAiFeedbackPrompt({
  answer: "학습자 답변",
  focus: "명확성",
  lessonTitle: "좋은 문장",
})

describe("module-local OpenAI feedback provider", () => {
  it("strict JSON schema 요청을 보내고 제품 결과를 domain에서 검증한다", async () => {
    const requests: OpenAiResponseCreateRequest[] = []
    const signal = new AbortController().signal
    const provider = createOpenAiFeedbackProvider({
      client: {
        responses: {
          async create(request) {
            requests.push(request)
            return {
              output_text: JSON.stringify({
                improvements: ["근거를 보강하세요."],
                nextAction: "예시를 추가하세요.",
                score: 88,
                strengths: ["주장이 명확합니다."],
                summary: "좋은 초안입니다.",
              }),
            }
          },
        },
      },
      model: "gpt-test",
      timeoutMs: 30_000,
    })

    await expect(provider.createFeedback(prompt, { signal })).resolves.toEqual(
      ok({
        improvements: ["근거를 보강하세요."],
        nextAction: "예시를 추가하세요.",
        score: 88,
        strengths: ["주장이 명확합니다."],
        summary: "좋은 초안입니다.",
      })
    )
    expect(requests[0]).toMatchObject({
      input: expect.stringContaining("학습자 답변"),
      model: "gpt-test",
      text: {
        format: {
          name: "writing_app_ai_feedback",
          strict: true,
          type: "json_schema",
        },
      },
    })
    expect(requests[0]?.text.format.schema.properties).not.toHaveProperty(
      "showScore"
    )
  })

  it("provider 원문이 잘못되면 원문 없이 invalid-response로 반환한다", async () => {
    const provider = createOpenAiFeedbackProvider({
      client: {
        responses: {
          async create() {
            return { output_text: "secret-provider-output" }
          },
        },
      },
      model: "gpt-test",
      timeoutMs: 30_000,
    })

    const result = await provider.createFeedback(prompt, {
      signal: new AbortController().signal,
    })
    expect(result).toEqual(err({ kind: "provider-response-invalid" }))
    expect(JSON.stringify(result)).not.toContain("secret-provider-output")
  })

  it("설정 실패는 fail-closed unavailable provider가 된다", async () => {
    const provider = createConfiguredAiFeedbackProvider({
      model: "gpt-test",
      runtime: err({
        kind: "configuration-invalid",
        operation: "configure",
        retryable: false,
      }),
    })

    await expect(
      provider.createFeedback(prompt, {
        signal: new AbortController().signal,
      })
    ).resolves.toEqual(err({ kind: "provider-unavailable" }))
  })

  it("usage observer에는 token 수와 model만 전달한다", async () => {
    const usage: unknown[] = []
    const provider = createOpenAiFeedbackProvider({
      client: {
        responses: {
          async create() {
            return {
              output_text: JSON.stringify({
                improvements: ["개선점"],
                nextAction: "다음 행동",
                score: 70,
                strengths: ["강점"],
                summary: "요약",
              }),
              usage: {
                input_tokens: 10,
                output_tokens: 20,
                total_tokens: 30,
              },
            }
          },
        },
      },
      model: "gpt-test",
      onUsage: (event) => usage.push(event),
      timeoutMs: 30_000,
    })

    await provider.createFeedback(prompt, {
      signal: new AbortController().signal,
    })

    expect(usage).toEqual([
      {
        inputTokens: 10,
        model: "gpt-test",
        outputTokens: 20,
        totalTokens: 30,
      },
    ])
    expect(JSON.stringify(usage)).not.toContain("학습자 답변")
  })
})

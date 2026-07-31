import { describe, expect, it } from "vitest"
import { err, ok } from "@workspace/kernel/result"

import { createAiFeedbackPrompt } from "#ai-feedback/domain/ai-feedback-prompt"
import {
  createConfiguredAiFeedbackProvider,
  createOpenAiFeedbackProvider,
  type OpenAiResponseCreateRequest,
  type OpenAiResponsesClient,
} from "#ai-feedback/infrastructure/adapters/openai-feedback-provider"

const prompt = createAiFeedbackPrompt({
  answer: "학습자 답변",
  focus: "명확성",
  lessonTitle: "좋은 문장",
})
const coachingResponseText = JSON.stringify({
  improvements: ["근거를 보강하세요."],
  nextAction: "예시를 추가하세요.",
  strengths: ["주장이 명확합니다."],
  summary: "좋은 초안입니다.",
})

describe("module-local OpenAI feedback provider", () => {
  it("provider가 반환한 결과를 domain coaching shape로 검증해 반환한다", async () => {
    const provider = aFakeOpenAiFeedbackProvider(async () => ({
      output_text: coachingResponseText,
    }))

    await expect(
      provider.createFeedback(prompt, {
        signal: new AbortController().signal,
      })
    ).resolves.toEqual(
      ok({
        feedback: {
          improvements: ["근거를 보강하세요."],
          nextAction: "예시를 추가하세요.",
          strengths: ["주장이 명확합니다."],
          summary: "좋은 초안입니다.",
        },
      })
    )
  })

  it("prompt와 model을 strict json_schema 요청으로 조립해 SDK에 보낸다", async () => {
    const requests: OpenAiResponseCreateRequest[] = []
    const provider = aFakeOpenAiFeedbackProvider(async (request) => {
      requests.push(request)
      return { output_text: coachingResponseText }
    })

    await provider.createFeedback(prompt, {
      signal: new AbortController().signal,
    })

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
    expect(requests[0]?.input).toContain("좋은 문장")
    expect(requests[0]?.input).toContain("명확성")
    expect(JSON.stringify(requests[0])).not.toContain(prompt.policyVersion)
  })

  it("strict json_schema는 4개 coaching 필드를 모두 required로 요구한다", async () => {
    const requests: OpenAiResponseCreateRequest[] = []
    const provider = aFakeOpenAiFeedbackProvider(async (request) => {
      requests.push(request)
      return { output_text: coachingResponseText }
    })

    await provider.createFeedback(prompt, {
      signal: new AbortController().signal,
    })

    expect(
      [...(requests[0]?.text.format.schema.required ?? [])].sort()
    ).toEqual(["improvements", "nextAction", "strengths", "summary"])
  })

  it("caller가 넘긴 timeout signal을 SDK 호출 option으로 전달한다", async () => {
    const signal = new AbortController().signal
    const observedSignals: AbortSignal[] = []
    const provider = aFakeOpenAiFeedbackProvider(async (_request, options) => {
      observedSignals.push(options.signal)
      return { output_text: coachingResponseText }
    })

    await provider.createFeedback(prompt, { signal })

    expect(observedSignals).toEqual([signal])
  })

  it("provider 원문이 잘못되면 원문 없이 invalid-response로 반환한다", async () => {
    const provider = aFakeOpenAiFeedbackProvider(async () => ({
      output_text: "secret-provider-output",
    }))

    const result = await provider.createFeedback(prompt, {
      signal: new AbortController().signal,
    })

    expect(result).toEqual(err({ kind: "provider-response-invalid" }))
    expect(JSON.stringify(result)).not.toContain("secret-provider-output")
  })

  it.each([
    {
      cause: Object.assign(new Error("aborted"), { name: "AbortError" }),
      kind: "request-aborted",
    },
    {
      cause: Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }),
      kind: "provider-timeout",
    },
    {
      cause: new Error("provider unavailable"),
      kind: "provider-unavailable",
    },
  ] as const)(
    "provider exception을 $kind로 구분한다",
    async ({ cause, kind }) => {
      const provider = aFakeOpenAiFeedbackProvider(async () =>
        Promise.reject(cause)
      )

      await expect(
        provider.createFeedback(prompt, {
          signal: new AbortController().signal,
        })
      ).resolves.toEqual(err({ cause, kind }))
    }
  )

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

  it("usage는 provider 응답 원문 없이 정규화해 반환한다", async () => {
    const provider = aFakeOpenAiFeedbackProvider(async () => ({
      output_text: JSON.stringify({
        improvements: ["개선점"],
        nextAction: "다음 행동",
        strengths: ["강점"],
        summary: "요약",
      }),
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
      },
    }))

    await expect(
      provider.createFeedback(prompt, {
        signal: new AbortController().signal,
      })
    ).resolves.toEqual(
      ok({
        feedback: {
          improvements: ["개선점"],
          nextAction: "다음 행동",
          strengths: ["강점"],
          summary: "요약",
        },
        usage: {
          inputTokens: 10,
          outputTokens: 20,
        },
      })
    )
  })

  it("관측 가능한 결과에 학습자 답변 원문을 담지 않는다", async () => {
    const provider = aFakeOpenAiFeedbackProvider(async () => ({
      output_text: coachingResponseText,
    }))

    const result = await provider.createFeedback(prompt, {
      signal: new AbortController().signal,
    })

    expect(JSON.stringify(result)).not.toContain("학습자 답변")
  })
})

function aFakeOpenAiFeedbackProvider(
  create: OpenAiResponsesClient["responses"]["create"]
) {
  return createOpenAiFeedbackProvider({
    client: { responses: { create } },
    model: "gpt-test",
    timeoutMs: 30_000,
  })
}

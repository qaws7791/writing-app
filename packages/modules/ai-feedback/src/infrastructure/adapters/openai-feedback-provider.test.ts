import { describe, expect, it } from "vitest"
import { err } from "@workspace/kernel/result"

import { createAiFeedbackPrompt } from "#ai-feedback/domain/ai-feedback-prompt"
import {
  createOpenAiFeedbackProvider,
  type OpenAiResponsesClient,
} from "#ai-feedback/infrastructure/adapters/openai-feedback-provider"

const prompt = createAiFeedbackPrompt({
  answer: "학습자 답변",
  focus: "명확성",
  lessonTitle: "좋은 문장",
})

describe("module-local OpenAI feedback provider", () => {
  it("잘못된 provider 응답을 원문 없이 invalid response로 반환한다", async () => {
    const providerOutput = "secret-provider-output"
    const provider = aFakeOpenAiFeedbackProvider(async () => ({
      output_text: providerOutput,
    }))

    const result = await provider.createFeedback(prompt, {
      signal: new AbortController().signal,
    })

    expect({
      exposesProviderOutput: JSON.stringify(result).includes(providerOutput),
      result: result.mapErr((error) => ({ kind: error.kind })),
    }).toEqual({
      exposesProviderOutput: false,
      result: err({ kind: "provider-response-invalid" }),
    })
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
    "provider exception을 $kind로 정규화한다",
    async ({ cause, kind }) => {
      const provider = aFakeOpenAiFeedbackProvider(async () =>
        Promise.reject(cause)
      )

      const result = await provider.createFeedback(prompt, {
        signal: new AbortController().signal,
      })

      expect(result.mapErr((error) => error.kind)).toEqual(err(kind))
    }
  )
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

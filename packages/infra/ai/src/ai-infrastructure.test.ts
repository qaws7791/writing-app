import { Mastra } from "@mastra/core/mastra"
import { describe, expect, it, vi } from "vitest"

import { createManagedMastraAgent } from "#ai/mastra-agent"
import { createOpenAiClient, normalizeAiProviderError } from "#ai/openai-client"

describe("AI infrastructure", () => {
  it("provider key 부재를 fail-closed Result로 반환한다", () => {
    expect(
      createOpenAiClient({ maxRetries: 0, timeoutMs: 30_000 }).isErr()
    ).toBe(true)
  })

  it("timeout과 이미 중단된 AbortSignal을 validated config에서 거부한다", () => {
    const controller = new AbortController()
    controller.abort("shutdown")

    expect(
      createOpenAiClient({ apiKey: "key", maxRetries: 0, timeoutMs: 0 }).isErr()
    ).toBe(true)
    expect(
      createOpenAiClient({
        apiKey: "key",
        maxRetries: 0,
        signal: controller.signal,
        timeoutMs: 30_000,
      }).isErr()
    ).toBe(true)
  })

  it("provider별 SDK retry 정책을 validated client config에 명시한다", () => {
    const result = createOpenAiClient({
      apiKey: "key",
      maxRetries: 0,
      timeoutMs: 30_000,
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) return
    expect(result.value.maxRetries).toBe(0)
    expect(result.value.client.maxRetries).toBe(0)
    expect(
      createOpenAiClient({
        apiKey: "key",
        maxRetries: -1,
        timeoutMs: 30_000,
      }).isErr()
    ).toBe(true)
  })

  it("provider exception cause를 typed error로 보존한다", () => {
    const cause = new Error("provider detail")
    expect(normalizeAiProviderError(cause, 30_000)).toMatchObject({
      cause,
      kind: "operation-failed",
      operation: "provider-request",
    })
  })

  it("stateless Agent stream은 숨은 worker 없이 runtime을 한 번만 종료한다", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createOpenAiStreamResponse("테스트 응답"))
    const startWorkers = vi.spyOn(Mastra.prototype, "startWorkers")
    const shutdown = vi.spyOn(Mastra.prototype, "shutdown")
    const warning = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined)
    const managedAgent = createManagedMastraAgent({
      id: "stateless-agent",
      instructions: "저장 상태를 사용하지 않습니다.",
      model: { apiKey: "test-key", id: "openai/test-model" },
      name: "Stateless Agent",
    })

    try {
      const output = await managedAgent.agent.stream("응답을 생성하세요.")
      const chunks: string[] = []
      for await (const chunk of output.textStream) chunks.push(chunk)
      await Promise.all([managedAgent.close(), managedAgent.close()])

      expect(chunks).toEqual(["테스트 응답"])
      expect(fetch).toHaveBeenCalledOnce()
      expect(startWorkers).not.toHaveBeenCalled()
      expect(shutdown).toHaveBeenCalledOnce()
      expect(warning).not.toHaveBeenCalled()
    } finally {
      await managedAgent.close()
      fetch.mockRestore()
      startWorkers.mockRestore()
      shutdown.mockRestore()
      warning.mockRestore()
    }
  })
})

function createOpenAiStreamResponse(text: string): Response {
  const events = [
    {
      response: {
        created_at: 0,
        id: "response-1",
        model: "test-model",
      },
      type: "response.created",
    },
    {
      item: { id: "message-1", type: "message" },
      output_index: 0,
      type: "response.output_item.added",
    },
    {
      delta: text,
      item_id: "message-1",
      type: "response.output_text.delta",
    },
    {
      response: {
        service_tier: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      },
      type: "response.completed",
    },
  ]
  const body = `${events
    .map((event) => `data: ${JSON.stringify(event)}\n\n`)
    .join("")}data: [DONE]\n\n`

  return new Response(body, {
    headers: { "content-type": "text/event-stream" },
    status: 200,
  })
}

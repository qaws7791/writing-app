import { describe, expect, it } from "vitest"

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
})

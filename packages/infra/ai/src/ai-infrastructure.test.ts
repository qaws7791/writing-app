import { describe, expect, it } from "vitest"

import { createOpenAiClient, normalizeAiProviderError } from "#ai/openai-client"

describe("AI infrastructure", () => {
  it("provider key 부재를 fail-closed Result로 반환한다", () => {
    expect(
      createOpenAiClient({ maxRetries: 0, timeoutMs: 30_000 }).isErr()
    ).toBe(true)
  })

  it("timeout 0을 validated config에서 거부한다", () => {
    expect(
      createOpenAiClient({ apiKey: "key", maxRetries: 0, timeoutMs: 0 }).isErr()
    ).toBe(true)
  })

  it("이미 중단된 AbortSignal을 validated config에서 거부한다", () => {
    const controller = new AbortController()
    controller.abort("shutdown")

    expect(
      createOpenAiClient({
        apiKey: "key",
        maxRetries: 0,
        signal: controller.signal,
        timeoutMs: 30_000,
      }).isErr()
    ).toBe(true)
  })

  it("음수 retry 정책을 validated config에서 거부한다", () => {
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

  it("AbortError를 재시도 불가능한 중단으로 정규화한다", () => {
    const cause = Object.assign(new Error("aborted"), { name: "AbortError" })

    expect(normalizeAiProviderError(cause, 30_000)).toEqual({
      cause,
      kind: "operation-aborted",
      operation: "provider-request",
      retryable: false,
    })
  })

  it("timeout exception을 재시도 가능한 시간 초과로 정규화한다", () => {
    const cause = Object.assign(new Error("timed out"), { code: "ETIMEDOUT" })

    expect(normalizeAiProviderError(cause, 30_000)).toEqual({
      cause,
      kind: "operation-timed-out",
      operation: "provider-request",
      retryable: true,
      timeoutMs: 30_000,
    })
  })
})

import { describe, expect, it, vi } from "vitest"

import { createManagedAiRuntime } from "#ai/lifecycle"
import { createOpenAiClient, normalizeAiProviderError } from "#ai/openai-client"

describe("AI infrastructure", () => {
  it("provider key 부재를 fail-closed Result로 반환한다", () => {
    expect(createOpenAiClient({ timeoutMs: 30_000 }).isErr()).toBe(true)
  })

  it("timeout과 이미 중단된 AbortSignal을 validated config에서 거부한다", () => {
    const controller = new AbortController()
    controller.abort("shutdown")

    expect(createOpenAiClient({ apiKey: "key", timeoutMs: 0 }).isErr()).toBe(
      true
    )
    expect(
      createOpenAiClient({
        apiKey: "key",
        signal: controller.signal,
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

  it("close는 idempotent하다", async () => {
    const cleanup = vi.fn()
    const result = createManagedAiRuntime((registerCleanup) => {
      registerCleanup(cleanup)
      return "runtime"
    })
    if (result.isErr()) throw result.error

    await Promise.all([result.value.close(), result.value.close()])
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it("partial initialization failure에서 등록된 cleanup을 호출한다", async () => {
    const cleanup = vi.fn()
    const cause = new Error("initialization failed")
    const result = createManagedAiRuntime((registerCleanup) => {
      registerCleanup(cleanup)
      throw cause
    })

    expect(result.isErr()).toBe(true)
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledOnce())
  })
})

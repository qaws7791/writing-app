import { describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { createOpenApiClient } from "@/lib/api/http/openapi-client"

describe("OpenAPI HTTP client", () => {
  it("fetch 예외를 네트워크 오류로 반환하면서 원인과 요청을 보고한다", async () => {
    const error = new TypeError("DNS lookup failed")
    const reportNetworkError = vi.fn()
    const client = createOpenApiClient({
      baseUrl: "https://api.example.test",
      fetch: async () => {
        throw error
      },
      reportNetworkError,
      tokenProvider: () => "token-1",
    })

    await expect(
      client.requestJson({
        method: "GET",
        path: "/profile",
        schema: z.object({ id: z.string() }),
      })
    ).resolves.toEqual({
      error: {
        code: "network-error",
        message: "네트워크 연결을 확인해 주세요.",
      },
      status: "error",
    })

    expect(reportNetworkError).toHaveBeenCalledWith({
      error,
      request: expect.objectContaining({
        method: "GET",
        url: "https://api.example.test/profile",
      }),
    })
  })
})

import { describe, expect, it, vi } from "vitest"
import { z } from "zod"

import type { ServerApiBaseUrl } from "@/shared/config/api-base-url"
import { createOpenApiClient } from "@/shared/http/openapi-client"

const apiBaseUrl = "https://api.example.test" as ServerApiBaseUrl

describe("OpenAPI HTTP client", () => {
  it("fetch 예외를 네트워크 오류로 반환하면서 원인과 요청을 보고한다", async () => {
    const cause = new TypeError("DNS lookup failed")
    const reportNetworkError = vi.fn()
    const client = createOpenApiClient({
      baseUrl: apiBaseUrl,
      fetch: async () => {
        throw cause
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
        code: "NETWORK_ERROR",
        message: "네트워크 연결을 확인해 주세요.",
        network: {
          cause,
          code: "network-error",
          kind: "failed",
          method: "GET",
          url: "https://api.example.test/profile",
        },
      },
      status: "error",
    })

    expect(reportNetworkError).toHaveBeenCalledWith({
      error: {
        cause,
        code: "network-error",
        kind: "failed",
        method: "GET",
        url: "https://api.example.test/profile",
      },
      request: expect.objectContaining({
        credentials: "include",
        method: "GET",
        url: "https://api.example.test/profile",
      }),
    })
  })

  it("세션 토큰이 있으면 Better Auth 쿠키 헤더로 전달한다", async () => {
    const requests: Request[] = []
    const client = createOpenApiClient({
      baseUrl: apiBaseUrl,
      fetch: async (request) => {
        requests.push(request)

        return Response.json({ id: "user-1" })
      },
      tokenProvider: () => "token-1.signature",
    })

    await expect(
      client.requestJson({
        method: "GET",
        path: "/profile",
        schema: z.object({ id: z.string() }),
      })
    ).resolves.toMatchObject({
      status: "ok",
    })

    expect(requests[0]?.headers.get("Cookie")).toBe(
      "learner_session_token=token-1.signature"
    )
    expect(requests[0]?.headers.has("Authorization")).toBe(false)
    expect(requests[0]?.credentials).toBe("include")
  })
})

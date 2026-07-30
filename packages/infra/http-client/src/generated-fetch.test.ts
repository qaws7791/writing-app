import { describe, expect, it, vi } from "vitest"

import {
  adminFetch,
  createGeneratedRequestOptions,
  GeneratedApiClientError,
  learnerFetch,
} from "#http-client/generated-fetch"

describe("Orval fetch mutator", () => {
  it("audience base path, server cookie와 AbortSignal을 Request에 전달한다", async () => {
    const fetch = vi.fn(async (request: Request) => {
      expect(request.url).toBe(
        "https://api.example.test/api/courses?cursor=next"
      )
      expect(request.headers.get("cookie")).toBe("session=learner")
      expect(request.credentials).toBe("include")
      expect(request.signal).toBe(signal)
      return Response.json({ items: [] })
    })
    const signal = new AbortController().signal

    const options = createGeneratedRequestOptions(
      {
        baseUrl: "https://api.example.test/",
        cookie: "session=learner",
        fetch,
      },
      { signal }
    )

    await expect(
      learnerFetch<{ items: unknown[] }>("/courses?cursor=next", {
        ...options,
        method: "GET",
      })
    ).resolves.toEqual({ items: [] })
    expect(fetch).toHaveBeenCalledOnce()
  })

  it("이미 완성된 admin prefix를 중복하지 않는다", async () => {
    const fetch = vi.fn(async (request: Request) => {
      expect(request.url).toBe("https://api.example.test/api/admin/analytics")
      return Response.json({ metrics: {} })
    })

    await adminFetch(
      "/api/admin/analytics",
      {},
      { baseUrl: "https://api.example.test", fetch }
    )

    expect(fetch).toHaveBeenCalledOnce()
  })

  it("canonical HTTP error와 Retry-After를 단일 client error로 만든다", async () => {
    const error = await captureError(() =>
      learnerFetch(
        "/feedback",
        {},
        {
          baseUrl: "https://api.example.test",
          fetch: async () =>
            Response.json(
              {
                code: "RATE_LIMITED",
                message: "잠시 후 다시 시도해 주세요.",
                requestId: "request-1",
                violations: [
                  {
                    code: "quota_exhausted",
                    message: "오늘 사용량을 모두 사용했습니다.",
                    path: "body",
                  },
                ],
              },
              { headers: { "Retry-After": "60" }, status: 429 }
            ),
        }
      )
    )

    expect(error).toBeInstanceOf(GeneratedApiClientError)
    expect(error.detail).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "잠시 후 다시 시도해 주세요.",
        requestId: "request-1",
        violations: [
          {
            code: "quota_exhausted",
            message: "오늘 사용량을 모두 사용했습니다.",
            path: "body",
          },
        ],
      },
      kind: "http",
      retryAfterSeconds: 60,
      status: 429,
    })
  })

  it.each([
    [
      "오류 body",
      async () => Response.json({ legacy: true }, { status: 400 }),
      "invalid-error-response",
      400,
    ],
    [
      "추가 필드가 있는 오류 body",
      async () =>
        Response.json(
          {
            code: "VALIDATION_FAILED",
            legacy: true,
            message: "요청을 확인해 주세요.",
            requestId: "request-1",
          },
          { status: 400 }
        ),
      "invalid-error-response",
      400,
    ],
    [
      "성공 JSON",
      async () => new Response("not-json"),
      "invalid-json-response",
      200,
    ],
  ] as const)(
    "유효하지 않은 %s를 contract error로 만든다",
    async (_label, fetch, reason, status) => {
      const error = await captureError(() =>
        learnerFetch(
          "/profile",
          {},
          {
            baseUrl: "https://api.example.test",
            fetch,
          }
        )
      )

      expect(error.detail).toEqual({ kind: "contract", reason, status })
    }
  )

  it.each([
    ["abort", new DOMException("aborted", "AbortError"), "aborted"],
    ["network", new Error("socket address"), "network"],
  ] as const)(
    "%s 예외를 분류하고 URL query를 노출하지 않는다",
    async (_label, cause, kind) => {
      const error = await captureError(() =>
        learnerFetch(
          "/profile?token=secret",
          {},
          {
            baseUrl: "https://api.example.test",
            fetch: async () => {
              throw cause
            },
          }
        )
      )

      expect(error.detail).toMatchObject({
        kind,
        method: "GET",
        url: "https://api.example.test/api/profile",
      })
      expect(JSON.stringify(error.detail)).not.toContain("secret")
    }
  )

  it("server 호출은 명시적인 base URL 없이는 실행하지 않는다", async () => {
    const error = await captureError(() => learnerFetch("/profile", {}))

    expect(error.detail).toEqual({
      kind: "contract",
      reason: "server-base-url-required",
      status: null,
    })
  })
})

async function captureError(
  action: () => Promise<unknown>
): Promise<GeneratedApiClientError> {
  try {
    await action()
  } catch (error) {
    if (error instanceof GeneratedApiClientError) return error
  }

  throw new Error("Expected GeneratedApiClientError")
}

import { Hono } from "hono"
import { describe, expect, it, vi } from "vitest"

import { createErrorHandler } from "#hono/errors"
import {
  createRequestBodyLimitMiddleware,
  createTrustedOriginMiddleware,
} from "#hono/security"

const trustedOrigin = "https://admin.example.test"

describe("요청 보안 middleware", () => {
  it("쿠키 인증 변경 요청은 신뢰한 Origin에서만 허용한다", async () => {
    const mutate = vi.fn()
    const app = createTestApp(mutate)

    const forbiddenResponse = await app.request("/mutation", {
      headers: {
        Cookie: "session=token",
        Origin: "https://attacker.example.test",
        "Sec-Fetch-Site": "same-site",
      },
      method: "POST",
    })

    expect(forbiddenResponse.status).toBe(403)
    expect(mutate).not.toHaveBeenCalled()

    const allowedResponse = await app.request("/mutation", {
      headers: {
        Cookie: "session=token",
        Origin: trustedOrigin,
        "Sec-Fetch-Site": "same-site",
      },
      method: "POST",
    })

    expect(allowedResponse.status).toBe(200)
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it("쿠키가 없는 bearer 방식 변경 요청은 Origin 없이 허용한다", async () => {
    const mutate = vi.fn()
    const app = createTestApp(mutate)

    const response = await app.request("/mutation", {
      headers: {
        Authorization: "Bearer token",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it("설정한 크기를 넘는 요청 본문은 handler 실행 전에 거절한다", async () => {
    const mutate = vi.fn()
    const app = createTestApp(mutate, 8)

    const response = await app.request("/mutation", {
      body: "123456789",
      headers: {
        "Content-Length": "9",
      },
      method: "POST",
    })

    expect(response.status).toBe(413)
    await expect(response.json()).resolves.toEqual({
      code: "PAYLOAD_TOO_LARGE",
      message: "Payload Too Large",
    })
    expect(mutate).not.toHaveBeenCalled()
  })
})

function createTestApp(mutate: () => void, maxSize = 1024) {
  const app = new Hono()

  app.onError(createErrorHandler())
  app.use("*", createRequestBodyLimitMiddleware({ maxSize }))
  app.use("*", createTrustedOriginMiddleware({ trustedOrigin }))
  app.post("/mutation", (context) => {
    mutate()
    return context.json({ saved: true })
  })

  return app
}

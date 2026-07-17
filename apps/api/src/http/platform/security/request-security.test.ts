import { Hono } from "hono"
import { describe, expect, it, vi } from "vitest"

import { createErrorHandler } from "@/http/platform/errors"
import {
  createRequestBodyLimitMiddleware,
  createTrustedOriginMiddleware,
} from "@/http/platform/security"

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
    await expect(forbiddenResponse.json()).resolves.toEqual({
      code: "FORBIDDEN_ORIGIN",
      message: "Forbidden",
    })
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

  it("설정한 크기까지 허용하고 1 byte를 넘으면 handler 실행 전에 거절한다", async () => {
    const mutate = vi.fn()
    const app = createTestApp(mutate, 8)

    const boundaryResponse = await app.request("/mutation", {
      body: "12345678",
      headers: { "Content-Length": "8" },
      method: "POST",
    })

    expect(boundaryResponse.status).toBe(200)
    expect(mutate).toHaveBeenCalledTimes(1)

    const oversizedResponse = await app.request("/mutation", {
      body: "123456789",
      headers: { "Content-Length": "9" },
      method: "POST",
    })

    expect(oversizedResponse.status).toBe(413)
    await expect(oversizedResponse.json()).resolves.toEqual({
      code: "PAYLOAD_TOO_LARGE",
      message: "Payload Too Large",
    })
    expect(mutate).toHaveBeenCalledTimes(1)
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

import { describe, expect, it } from "vitest"
import { Hono } from "hono"

import {
  setPrivateNoStoreHeaders,
  withPrivateNoStore,
} from "#http-platform/security"

describe("민감 응답 캐시 정책", () => {
  it("응답을 재구성할 때 기존 Vary에 Cookie를 더한다", () => {
    const response = withPrivateNoStore(
      new Response("문서", { headers: { Vary: "Origin" } })
    )

    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("Vary")).toBe("Origin, Cookie")
  })

  it("Vary가 없는 응답에도 Cookie vary를 남긴다", () => {
    const response = withPrivateNoStore(new Response("문서"))

    expect(response.headers.get("Vary")).toBe("Cookie")
  })

  it("미들웨어 경로도 실제 응답에 캐시 금지와 Cookie vary를 남긴다", async () => {
    const app = new Hono().get("/profile", (context) => {
      context.header("Vary", "Origin")
      setPrivateNoStoreHeaders(context)

      return context.json({ ok: true })
    })

    const response = await app.request("/profile")

    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("Vary")).toBe("Origin, Cookie")
  })
})

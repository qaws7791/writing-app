import { describe, expect, it } from "vitest"

import {
  privateNoStoreCacheControl,
  withPrivateNoStore,
} from "@/http/platform/security"

describe("민감 응답 캐시 정책", () => {
  it("기존 응답 계약을 보존하고 private no-store와 Cookie vary를 추가한다", async () => {
    const response = withPrivateNoStore(
      new Response("문서", {
        headers: {
          "Content-Disposition": 'attachment; filename="document.md"',
          "Content-Type": "text/markdown; charset=utf-8",
          Vary: "Origin",
        },
        status: 201,
        statusText: "Created",
      })
    )

    expect(response.status).toBe(201)
    expect(response.statusText).toBe("Created")
    expect(response.headers.get("Cache-Control")).toBe(
      privateNoStoreCacheControl
    )
    expect(response.headers.get("Vary")).toBe("Origin, Cookie")
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="document.md"'
    )
    expect(response.headers.get("Content-Type")).toContain("text/markdown")
    await expect(response.text()).resolves.toBe("문서")
  })
})

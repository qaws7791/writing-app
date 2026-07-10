import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "@/app/api/ai-chat/stream/route"

const { getTokenMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(async () => "admin-token"),
}))

vi.mock("@/lib/auth/server-admin-session-token", () => ({
  getServerAdminSessionToken: getTokenMock,
}))

describe("어드민 AI chat proxy", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("신뢰하지 않은 Origin 요청은 upstream 호출 전에 거절한다", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const response = await POST(
      new Request("http://localhost:3001/api/ai-chat/stream", {
        body: JSON.stringify({ message: "요청" }),
        headers: { Origin: "https://attacker.example.test" },
        method: "POST",
      })
    )

    expect(response.status).toBe(403)
    expect(getTokenMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("신뢰한 Origin을 upstream 요청에도 명시한다", async () => {
    const fetchMock = vi.fn(
      async (request: RequestInfo | URL, init?: RequestInit) => {
        const resolvedRequest =
          request instanceof Request ? request : new Request(request, init)
        expect(resolvedRequest.headers.get("Origin")).toBe(
          "http://localhost:3001"
        )
        return new Response("data", {
          headers: { "Content-Type": "text/event-stream" },
        })
      }
    )
    vi.stubGlobal("fetch", fetchMock)

    const response = await POST(
      new Request("http://localhost:3001/api/ai-chat/stream", {
        body: JSON.stringify({ message: "요청" }),
        headers: { Origin: "http://localhost:3001" },
        method: "POST",
      })
    )

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

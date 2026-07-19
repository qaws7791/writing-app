import { beforeEach, describe, expect, it, vi } from "vitest"

import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { handleAdminAiChatStream as POST } from "@/features/ai-chat/server/route-handlers/admin-ai-chat-stream-route-handler"

const { getTokenMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn<() => Promise<string | null>>(async () => "admin-token"),
}))

vi.mock("@/server/auth/get-admin-session-token", () => ({
  getServerAdminSessionToken: getTokenMock,
}))

describe("어드민 AI chat proxy", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    getTokenMock.mockResolvedValue("admin-token")
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
          localRuntimeDefaults.adminWebOrigin
        )
        return new Response("data", {
          headers: { "Content-Type": "text/event-stream" },
        })
      }
    )
    vi.stubGlobal("fetch", fetchMock)

    const response = await POST(
      new Request(`${localRuntimeDefaults.adminWebOrigin}/api/ai-chat/stream`, {
        body: JSON.stringify({ message: "요청" }),
        headers: { Origin: localRuntimeDefaults.adminWebOrigin },
        method: "POST",
      })
    )

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("미인증 요청과 잘못된 body는 upstream 호출 전에 거절한다", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    getTokenMock.mockResolvedValueOnce(null)

    const unauthorized = await POST(
      new Request(`${localRuntimeDefaults.adminWebOrigin}/api/ai-chat/stream`, {
        body: JSON.stringify({ message: "요청" }),
        headers: { Origin: localRuntimeDefaults.adminWebOrigin },
        method: "POST",
      })
    )
    const malformed = await POST(
      new Request(`${localRuntimeDefaults.adminWebOrigin}/api/ai-chat/stream`, {
        body: "{",
        headers: { Origin: localRuntimeDefaults.adminWebOrigin },
        method: "POST",
      })
    )

    expect(unauthorized.status).toBe(401)
    expect(malformed.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("64 KiB를 넘는 body를 거절한다", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const response = await POST(
      new Request(`${localRuntimeDefaults.adminWebOrigin}/api/ai-chat/stream`, {
        body: JSON.stringify({ message: "가".repeat(70_000) }),
        headers: { Origin: localRuntimeDefaults.adminWebOrigin },
        method: "POST",
      })
    )

    expect(response.status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

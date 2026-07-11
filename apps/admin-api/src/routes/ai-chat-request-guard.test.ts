import { describe, expect, it } from "vitest"

import { createAiChatRequestGuard } from "@/routes/ai-chat-request-guard"

const now = new Date("2026-07-12T00:00:00.000Z")

describe("관리자 AI 채팅 요청 guard", () => {
  it("같은 대화의 동시 요청은 하나만 허용한다", () => {
    const guard = createAiChatRequestGuard()
    const input = {
      adminId: "admin-1",
      clientIp: "127.0.0.1",
      conversationId: "chat-1",
      now,
    }

    const first = guard.acquire(input)
    const second = guard.acquire(input)

    expect(first.kind).toBe("accepted")
    expect(second).toEqual({
      kind: "rejected",
      reason: "in-flight",
      retryAfterSeconds: 1,
    })
    if (first.kind === "accepted") {
      first.release()
    }
    expect(guard.acquire(input).kind).toBe("accepted")
  })

  it("관리자와 IP 요청 한도를 Retry-After와 함께 거절한다", () => {
    const guard = createAiChatRequestGuard({
      dailyAdminLimit: 10,
      minuteAdminLimit: 1,
      minuteIpLimit: 10,
    })
    const first = guard.acquire({
      adminId: "admin-1",
      clientIp: "127.0.0.1",
      conversationId: "chat-1",
      now,
    })
    if (first.kind === "accepted") {
      first.release()
    }

    expect(
      guard.acquire({
        adminId: "admin-1",
        clientIp: "127.0.0.2",
        conversationId: "chat-2",
        now,
      })
    ).toEqual({
      kind: "rejected",
      reason: "rate-limit",
      retryAfterSeconds: 60,
    })
  })
})

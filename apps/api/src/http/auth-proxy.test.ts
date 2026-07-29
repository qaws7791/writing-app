import { describe, expect, it } from "vitest"

import { createTestLearnerApp } from "@/test-support/learner-app-fixture"

describe("플랫폼 API auth route", () => {
  it("인증 없는 session 요청은 401이다", async () => {
    const app = createTestLearnerApp()

    const response = await app.request("/auth/session")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHENTICATED",
      message: "로그인이 필요합니다.",
      requestId: response.headers.get("x-request-id"),
    })
  })

  it("인증된 session 요청은 사용자 정보를 반환한다", async () => {
    const app = createTestLearnerApp()

    const response = await app.request("/auth/session", {
      headers: {
        Cookie: "learner_session_token=active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      user: {
        email: "learner@example.com",
        id: "user-1",
        image: null,
        joinedAt: "2026-06-14T00:00:00.000Z",
        name: "학습자",
        status: "active",
      },
    })
  })
})

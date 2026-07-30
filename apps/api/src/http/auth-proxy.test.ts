import { describe, expect, it } from "vitest"

import {
  activeLearnerSession,
  createTestLearnerApp,
} from "@/test-support/learner-app-fixture"
import { learnerSessionCookieHeader } from "@/test-support/learner-session-cookie"

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

  it("인증된 session 요청은 fixture 학습자 정보를 반환한다", async () => {
    const app = createTestLearnerApp()

    const response = await app.request("/auth/session", {
      headers: {
        Cookie: learnerSessionCookieHeader("active-token"),
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      user: activeLearnerSession.user,
    })
  })
})

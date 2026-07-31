import { describe, expect, it } from "vitest"

import {
  activeLearnerSession,
  createTestLearnerApp,
} from "@/test-support/learner-app-fixture"
import { learnerSessionCookieHeader } from "@/test-support/learner-session-cookie"

describe("플랫폼 API auth route", () => {
  it("auth handler가 구성돼도 session 조회는 제품 identity route가 처리한다", async () => {
    const app = createTestLearnerApp({
      authHandler: async () => {
        throw new Error("session 조회를 auth handler에 위임할 수 없습니다.")
      },
    })

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

  it("session 외 auth 경로는 auth handler의 응답을 반환한다", async () => {
    const app = createTestLearnerApp({
      authHandler: async (request) =>
        Response.json(
          {
            method: request.method,
            path: new URL(request.url).pathname,
          },
          { status: 202 }
        ),
    })

    const response = await app.request("/auth/sign-out", { method: "POST" })

    expect(response.status).toBe(202)
    expect(response.headers.get("cache-control")).toContain("no-store")
    await expect(response.json()).resolves.toEqual({
      method: "POST",
      path: "/auth/sign-out",
    })
  })
})

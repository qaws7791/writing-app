import { describe, expect, it } from "vitest"
import { localRuntimeDefaults } from "@workspace/env"

import { createApp, type ApiDependencies } from "@/app"

const activeSession = {
  user: {
    email: "learner@example.com",
    id: "user-1",
    image: null,
    joinedAt: "2026-06-14T00:00:00.000Z",
    name: "학습자",
    status: "active",
  },
} as const

const profileStats = {
  completedLessons: 3,
  currentStreakDays: 2,
  lastActiveDate: "2026-06-14",
  progressPercent: 7,
  totalLessons: 44,
} as const

describe("플랫폼 API profile route", () => {
  it("브라우저 쓰기 요청 preflight에 CORS 헤더로 응답한다", async () => {
    const app = createApp({
      ...createDependencies(),
      webOrigin: localRuntimeDefaults.learnerWebOrigin,
    })

    const response = await app.request("/learning/answers", {
      headers: {
        "Access-Control-Request-Headers": "authorization,content-type",
        "Access-Control-Request-Method": "POST",
        Origin: localRuntimeDefaults.learnerWebOrigin,
      },
      method: "OPTIONS",
    })

    expect(response.status).toBe(204)
    expect(response.headers.get("access-control-allow-origin")).toBe(
      localRuntimeDefaults.learnerWebOrigin
    )
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true"
    )
  })

  it("인증 없는 profile 요청은 401이다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/profile")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
      },
    })
  })

  it("인증된 active 사용자의 profile과 통계를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/profile", {
      headers: {
        Authorization: "Bearer active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      stats: profileStats,
      user: activeSession.user,
    })
  })

  it("suspended 또는 deleted 사용자는 보호 route에서 차단한다", async () => {
    const app = createApp(createDependencies())

    for (const token of ["suspended-token", "deleted-token"]) {
      const response = await app.request("/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "account_unavailable",
        },
      })
    }
  })
})

function createDependencies(): ApiDependencies {
  return {
    profileReader: {
      async readProfileStats() {
        return profileStats
      },
    },
    sessionResolver: {
      async resolveSession(token) {
        if (token === "active-token") {
          return activeSession
        }

        if (token === "suspended-token") {
          return {
            user: {
              ...activeSession.user,
              status: "suspended",
            },
          }
        }

        if (token === "deleted-token") {
          return {
            user: {
              ...activeSession.user,
              status: "deleted",
            },
          }
        }

        return null
      },
    },
  }
}

import { describe, expect, it } from "vitest"
import { readBearerToken } from "@workspace/core/auth"
import { localRuntimeDefaults } from "@workspace/env"
import { z } from "zod"

import { createApp, type ApiDependencies } from "@/app"

type CapturedRequestLogEvent = {
  readonly durationMs: number
  readonly method: string
  readonly path: string
  readonly requestId?: string
  readonly status: number
}

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
  it("요청 완료 로그에 request id와 응답 상태를 남긴다", async () => {
    const requestEvents: CapturedRequestLogEvent[] = []
    const app = createApp({
      ...createDependencies(),
      requestLogger(event) {
        requestEvents.push(event)
      },
    })

    const response = await app.request("/profile", {
      headers: {
        "X-Request-ID": "request-1",
      },
    })

    expect(response.status).toBe(401)
    expect(response.headers.get("x-request-id")).toBe("request-1")
    expect(requestEvents).toHaveLength(1)
    expect(requestEvents[0]).toMatchObject({
      method: "GET",
      path: "/profile",
      requestId: "request-1",
      status: 401,
    })
    expect(requestEvents[0]?.durationMs).toBeGreaterThanOrEqual(0)
  })

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

  it("기존 Google 로그인 시작 경로를 Better Auth social sign-in으로 위임한다", async () => {
    const capturedRequests: Request[] = []
    const app = createApp({
      ...createDependencies(),
      async authHandler(request) {
        capturedRequests.push(request)

        return Response.json({
          redirect: true,
          url: "https://accounts.google.com/o/oauth2/v2/auth",
        })
      },
    })

    const response = await app.request(
      "/api/auth/sign-in/google?callbackURL=%2Fapp%2Fcourses"
    )

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth"
    )
    const capturedRequest = capturedRequests[0]

    expect(capturedRequest?.method).toBe("POST")
    expect(new URL(capturedRequest?.url ?? "").pathname).toBe(
      "/api/auth/sign-in/social"
    )
    await expect(capturedRequest?.json()).resolves.toEqual({
      callbackURL: "/app/courses",
      provider: "google",
    })
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

  it("ZodError 예외를 invalid_request JSON 400으로 변환한다", async () => {
    const app = createApp({
      ...createDependencies(),
      learningService: {
        async completeLesson() {
          throw new z.ZodError([])
        },
        async saveLessonProgress() {
          throw new z.ZodError([])
        },
        async saveStepAnswer() {
          throw new z.ZodError([])
        },
      },
      now: () => new Date("2026-06-15T09:00:00.000Z"),
    })

    const response = await app.request("/learning/answers", {
      body: JSON.stringify({
        answer: {
          selectedOptionId: "b",
          type: "MULTIPLE_CHOICE",
        },
        lessonId: "lesson-1",
        stepId: "step-1",
      }),
      headers: {
        Authorization: "Bearer active-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
      },
    })
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
      async resolveSession(headers) {
        const token = readTestSessionToken(headers)

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

function readTestSessionToken(headers: Headers): string | null {
  const cookieToken = headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === "kwep_session")?.[1]

  if (cookieToken !== undefined) {
    return decodeURIComponent(cookieToken)
  }

  return readBearerToken(headers.get("Authorization"))
}

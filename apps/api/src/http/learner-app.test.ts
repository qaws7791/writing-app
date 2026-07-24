import { describe, expect, it, vi } from "vitest"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import type { SessionResolver } from "@workspace/identity/sessions"

import { createTestLearnerApp } from "@/routes/test-dependencies"

type CapturedRequestLogEvent = {
  readonly actorId?: string
  readonly actorType?: "admin" | "learner"
  readonly audience: "admin" | "learner"
  readonly durationMs: number
  readonly errorClass?: "client-error" | "server-error"
  readonly method: string
  readonly outcome: "failed" | "succeeded"
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
    const app = createFixture({
      runtime: {
        requestLogger(event) {
          requestEvents.push(event)
        },
      },
    })

    const response = await app.request("/profile", {
      headers: {
        "X-Request-ID": "request-1",
      },
    })

    expect(response.status).toBe(401)
    expect(response.headers.get("x-request-id")).not.toBe("request-1")
    expect(requestEvents).toHaveLength(1)
    expect(requestEvents[0]).toMatchObject({
      audience: "learner",
      method: "GET",
      errorClass: "client-error",
      outcome: "failed",
      path: "/profile",
      externalRequestId: "request-1",
      requestId: response.headers.get("x-request-id"),
      status: 401,
    })
    expect(requestEvents[0]?.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("인증 요청 완료 로그에 학습자 actor를 보강한다", async () => {
    const requestEvents: CapturedRequestLogEvent[] = []
    const app = createFixture({
      runtime: {
        requestLogger(event) {
          requestEvents.push(event)
        },
      },
    })

    const response = await app.request("/profile", {
      headers: { Cookie: "learner_session_token=active-token" },
    })

    expect(response.status).toBe(200)
    expect(requestEvents[0]).toMatchObject({
      actorId: "user-1",
      actorType: "learner",
      audience: "learner",
      outcome: "succeeded",
      status: 200,
    })
    expect(JSON.stringify(requestEvents[0])).not.toMatch(
      /authorization|cookie|token|email/i
    )
  })

  it("identity와 독립된 learning 인증도 공통 actor context를 남긴다", async () => {
    const requestEvents: CapturedRequestLogEvent[] = []
    const app = createFixture({
      runtime: {
        requestLogger(event) {
          requestEvents.push(event)
        },
      },
    })

    const response = await app.request("/courses", {
      headers: { Cookie: "learner_session_token=active-token" },
    })

    expect(response.status).toBe(200)
    expect(requestEvents[0]).toMatchObject({
      actorId: "user-1",
      actorType: "learner",
      audience: "learner",
      outcome: "succeeded",
      status: 200,
    })
  })

  it("신뢰하지 않은 Origin의 쿠키 인증 변경 요청을 side effect 전에 거절한다", async () => {
    const submitStep = vi.fn(async () => {
      throw new Error("submitStep must not be called")
    })
    const app = createFixture({ submitStep })

    const response = await app.request(
      "/learning/lessons/lesson-1/steps/step-1/complete",
      {
        body: "{}",
        headers: {
          Cookie: "learner_session_token=active-token",
          "Content-Type": "application/json",
          Origin: "https://attacker.example.test",
          "Sec-Fetch-Site": "same-site",
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN_ORIGIN",
      message: "Forbidden",
      requestId: response.headers.get("x-request-id"),
    })
    expect(submitStep).not.toHaveBeenCalled()
  })

  it("학습자 API는 실제 1 MiB 본문을 전달하고 1 byte 초과를 side effect 전에 거절한다", async () => {
    const submitStep = vi.fn(async () => {
      throw new Error("submitStep must not be called")
    })
    const app = createFixture({ submitStep })
    const bodyLimitBytes = 1024 * 1024
    const emptyPaddingJson = JSON.stringify({ padding: "" })

    for (const fixture of [
      {
        byteLength: bodyLimitBytes,
        expectedCode: "VALIDATION_FAILED",
        expectedStatus: 400,
      },
      {
        byteLength: bodyLimitBytes + 1,
        expectedCode: "PAYLOAD_TOO_LARGE",
        expectedStatus: 413,
      },
    ] as const) {
      const body = JSON.stringify({
        padding: "x".repeat(fixture.byteLength - emptyPaddingJson.length),
      })

      expect(new TextEncoder().encode(body)).toHaveLength(fixture.byteLength)

      const response = await app.request(
        "/learning/lessons/lesson-1/steps/step-1/complete",
        {
          body,
          headers: {
            Cookie: "learner_session_token=active-token",
            "Content-Length": String(fixture.byteLength),
            "Content-Type": "application/json",
            Origin: localRuntimeDefaults.learnerWebOrigin,
          },
          method: "POST",
        }
      )

      expect(response.status).toBe(fixture.expectedStatus)
      await expect(response.json()).resolves.toMatchObject({
        code: fixture.expectedCode,
        requestId: response.headers.get("x-request-id"),
      })
    }

    expect(submitStep).not.toHaveBeenCalled()
  })

  it("예상된 security와 body-limit 거절은 내부 결함 logger로 전달하지 않는다", async () => {
    const errorLogger = vi.fn()
    const app = createFixture({ runtime: { errorLogger } })

    const forbiddenOrigin = await app.request(
      "/learning/lessons/lesson-1/steps/step-1/complete",
      {
        body: "{}",
        headers: {
          Cookie: "learner_session_token=active-token",
          "Content-Type": "application/json",
          Origin: "https://attacker.example.test",
        },
        method: "POST",
      }
    )
    const oversized = await app.request("/api/auth/test", {
      body: "x".repeat(1024 * 1024 + 1),
      headers: { "Content-Length": String(1024 * 1024 + 1) },
      method: "POST",
    })

    expect(forbiddenOrigin.status).toBe(403)
    expect(oversized.status).toBe(413)
    expect(errorLogger).not.toHaveBeenCalled()
  })

  it("기존 Google 로그인 시작 경로를 Better Auth social sign-in으로 위임한다", async () => {
    const capturedRequests: Request[] = []
    const app = createFixture({
      async authHandler(request) {
        capturedRequests.push(request)

        return Response.json({
          redirect: true,
          url: "https://accounts.google.com/o/oauth2/v2/auth",
        })
      },
    })

    const response = await app.request(
      "/auth/sign-in/google?callbackURL=%2Fapp%2Fcourses"
    )

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth"
    )
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("Vary")).toContain("Cookie")
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

  it("Better Auth 403 code를 canonical envelope에서 보존한다", async () => {
    const app = createFixture({
      async authHandler() {
        return Response.json(
          {
            code: "EMAIL_NOT_VERIFIED",
            message: "Email is not verified",
          },
          { status: 403 }
        )
      },
    })

    const response = await app.request("/auth/sign-in/email", {
      body: JSON.stringify({
        email: "learner@example.com",
        password: "password",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    expect(response.status).toBe(403)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    await expect(response.json()).resolves.toEqual({
      code: "EMAIL_NOT_VERIFIED",
      message: "Email is not verified",
      requestId: response.headers.get("x-request-id"),
    })
  })

  it("인증 없는 profile 요청은 401이다", async () => {
    const app = createFixture()

    const response = await app.request("/profile")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHENTICATED",
      message: "로그인이 필요합니다.",
      requestId: response.headers.get("x-request-id"),
    })
  })

  it("인증된 active 사용자의 profile과 통계를 반환한다", async () => {
    const app = createFixture()

    const response = await app.request("/profile", {
      headers: {
        Cookie: "learner_session_token=active-token",
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("Vary")).toContain("Cookie")
    await expect(response.json()).resolves.toEqual({
      stats: profileStats,
      user: activeSession.user,
    })
  })

  it("Bearer 토큰만으로 보호 route에 접근할 수 없다", async () => {
    const app = createFixture()

    const response = await app.request("/profile", {
      headers: { Authorization: "Bearer active-token" },
    })

    expect(response.status).toBe(401)
  })

  it("공개 health와 OpenAPI 응답에는 민감 응답 캐시 정책을 추가하지 않는다", async () => {
    const app = createFixture()

    for (const path of ["/health", "/openapi"]) {
      const response = await app.request(path)

      expect(response.status).toBe(200)
      expect(response.headers.get("Cache-Control")).not.toBe(
        "private, no-store"
      )
    }
  })

  it("suspended 또는 deleted 사용자는 보호 route에서 차단한다", async () => {
    const app = createFixture()

    for (const token of ["suspended-token", "deleted-token"]) {
      const response = await app.request("/profile", {
        headers: {
          Cookie: `learner_session_token=${token}`,
        },
      })

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({
        code: "FORBIDDEN",
        message: "사용할 수 없는 계정입니다.",
        requestId: response.headers.get("x-request-id"),
      })
    }
  })

  it("단계 완료 transport validation 실패를 VALIDATION_FAILED 오류로 변환한다", async () => {
    const app = createFixture()

    const response = await app.request(
      "/learning/lessons/lesson-1/steps/step-1/complete",
      {
        body: JSON.stringify({
          answer: {
            type: "UNSUPPORTED",
          },
          kind: "answer",
        }),
        headers: {
          Cookie: "learner_session_token=active-token",
          "Content-Type": "application/json",
          Origin: localRuntimeDefaults.learnerWebOrigin,
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
      requestId: response.headers.get("x-request-id"),
      violations: expect.arrayContaining([
        expect.objectContaining({
          path: "answer.type",
        }),
      ]),
    })
  })

  it("빈 body와 잘못된 JSON을 같은 transport 오류로 거절한다", async () => {
    const submitStep = vi.fn(async () => {
      throw new Error("submitStep must not be called")
    })
    const app = createFixture({ submitStep })

    for (const body of ["", "{"] as const) {
      const response = await app.request(
        "/learning/lessons/lesson-1/steps/step-1/complete",
        {
          body,
          headers: {
            Cookie: "learner_session_token=active-token",
            "Content-Type": "application/json",
            Origin: localRuntimeDefaults.learnerWebOrigin,
          },
          method: "POST",
        }
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        code: "VALIDATION_FAILED",
        requestId: response.headers.get("x-request-id"),
      })
    }

    expect(submitStep).not.toHaveBeenCalled()
  })

  it("요청 계약에 없는 JSON 필드를 VALIDATION_FAILED로 거절한다", async () => {
    const app = createFixture()

    const response = await app.request(
      "/learning/lessons/lesson-1/steps/step-1/complete",
      {
        body: JSON.stringify({
          answer: {
            selectedOptionId: "option-1",
            type: "MULTIPLE_CHOICE",
          },
          kind: "answer",
          unknown: true,
        }),
        headers: {
          Cookie: "learner_session_token=active-token",
          "Content-Type": "application/json",
          Origin: localRuntimeDefaults.learnerWebOrigin,
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      requestId: response.headers.get("x-request-id"),
      violations: [
        expect.objectContaining({
          path: "",
        }),
      ],
    })
  })

  it("제거한 학습 쓰기 endpoint는 404를 반환한다", async () => {
    const app = createFixture()

    for (const path of [
      "/learning/answers",
      "/learning/lessons/lesson-1/progress",
      "/learning/lessons/lesson-1/complete",
      "/ai-feedback",
    ]) {
      const response = await app.request(path, {
        body: "{}",
        headers: {
          Cookie: "learner_session_token=active-token",
          "Content-Type": "application/json",
          Origin: localRuntimeDefaults.learnerWebOrigin,
        },
        method: "POST",
      })

      expect(response.status).toBe(404)
    }
  })
})

function createFixture(input: Parameters<typeof createTestLearnerApp>[0] = {}) {
  const sessionResolver: SessionResolver = {
    async resolveSession(headers) {
      const token = readTestSessionToken(headers)

      if (token === "active-token") return activeSession
      if (token === "suspended-token") {
        return { user: { ...activeSession.user, status: "suspended" } }
      }
      if (token === "deleted-token") {
        return { user: { ...activeSession.user, status: "deleted" } }
      }

      return null
    },
  }

  return createTestLearnerApp({
    ...input,
    profileStats,
    sessionResolver,
  })
}

function readTestSessionToken(headers: Headers): string | null {
  const cookieToken = headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === "learner_session_token")?.[1]

  if (cookieToken !== undefined) {
    return decodeURIComponent(cookieToken)
  }

  return null
}

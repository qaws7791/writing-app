import { Hono } from "hono"
import { describe, expect, it, vi } from "vitest"

import {
  createRequestLoggingMiddleware,
  normalizeExternalRequestId,
} from "@/hono-request-logger"
import type { RequestLogEvent } from "@/request-logger"
import type { SecurityAuditEvent } from "@/security-audit-logger"

describe("Hono request logging middleware", () => {
  it("외부 request id와 서버 request id를 분리한다", async () => {
    const events: RequestLogEvent[] = []
    const createRequestId = vi.fn(() => "generated-request-id")
    const readMonotonicTimeMs = createMonotonicClock([10.2, 18.8])
    const app = new Hono()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId,
        logRequest: (event) => events.push(event),
        readMonotonicTimeMs,
      })
    )
    app.get("/health", (context) => context.text("ok", 202))

    const response = await app.request("/health", {
      headers: {
        "x-request-id": "incoming-request-id",
      },
    })

    expect(response.headers.get("x-request-id")).toBe("generated-request-id")
    expect(createRequestId).toHaveBeenCalledOnce()
    expect(events).toEqual([
      {
        durationMs: 9,
        method: "GET",
        path: "/health",
        externalRequestId: "incoming-request-id",
        requestId: "generated-request-id",
        status: 202,
      },
    ])
  })

  it("초장문과 제어 문자가 있는 외부 request id는 로그에서 제외한다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId: () => "server-request-id",
        logRequest: (event) => events.push(event),
      })
    )
    app.get("/health", (context) => context.text("ok"))

    await app.request("/health", {
      headers: { "x-request-id": "a".repeat(129) },
    })

    expect(events[0]).not.toHaveProperty("externalRequestId")
    expect(events[0]?.requestId).toBe("server-request-id")
    expect(normalizeExternalRequestId("line\nbreak")).toBeUndefined()
  })

  it("인증 middleware가 설정한 actor를 완료 로그에 보강한다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId: () => "server-request-id",
        logRequest: (event) => events.push(event),
        readActor: () => ({ id: "user-1", type: "learner" }),
      })
    )
    app.get("/profile", (context) => context.text("ok"))

    await app.request("/profile")

    expect(events[0]).toMatchObject({
      actorId: "user-1",
      actorType: "learner",
    })
  })

  it("owner 변경·인증 실패·AI quota를 민감 필드 없는 감사 이벤트로 남긴다", async () => {
    const audits: SecurityAuditEvent[] = []
    const ownerApp = new Hono()
    ownerApp.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId: () => "owner-request-id",
        logRequest: () => undefined,
        logSecurityAudit: (event) => audits.push(event),
        readActor: () => ({ id: "admin-1", role: "owner", type: "admin" }),
      })
    )
    ownerApp.patch("/users/user-1/status", (context) =>
      context.json({ ok: true })
    )

    await ownerApp.request("/users/user-1/status", {
      body: JSON.stringify({ token: "secret", status: "suspended" }),
      headers: { Authorization: "Bearer secret", Cookie: "session=secret" },
      method: "PATCH",
    })

    const failureApp = new Hono()
    failureApp.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId: () => "failure-request-id",
        logRequest: () => undefined,
        logSecurityAudit: (event) => audits.push(event),
      })
    )
    failureApp.post("/api/auth/sign-in/email", (context) =>
      context.text("no", 401)
    )
    failureApp.post("/ai-feedback", (context) => context.text("limit", 429))

    await failureApp.request("/api/auth/sign-in/email", { method: "POST" })
    await failureApp.request("/ai-feedback", { method: "POST" })

    expect(audits).toEqual([
      {
        action: "owner.mutation",
        actorId: "admin-1",
        actorType: "admin",
        outcome: "succeeded",
        requestId: "owner-request-id",
        target: "PATCH /users/user-1/status",
      },
      {
        action: "authentication.failed",
        outcome: "denied",
        requestId: "failure-request-id",
        target: "POST /api/auth/sign-in/email",
      },
      {
        action: "ai.quota.exceeded",
        outcome: "denied",
        requestId: "failure-request-id",
        target: "POST /ai-feedback",
      },
    ])
    expect(JSON.stringify(audits)).not.toMatch(/secret|cookie|token/i)
  })

  it("request id가 없으면 주입된 generator로 새 id를 만들고 response header에 싣는다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId: () => "generated-request-id",
        logRequest: (event) => events.push(event),
        readMonotonicTimeMs: createMonotonicClock([1, 1]),
      })
    )
    app.get("/courses", (context) => context.json({ ok: true }))

    const response = await app.request("/courses")

    expect(response.headers.get("x-request-id")).toBe("generated-request-id")
    expect(events[0]).toMatchObject({
      durationMs: 0,
      method: "GET",
      path: "/courses",
      requestId: "generated-request-id",
      status: 200,
    })
  })

  it("route가 예외를 던져도 finally에서 요청 로그를 남긴다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono()

    app.onError((_error, context) => context.text("failed", 500))
    app.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId: () => "failed-request-id",
        logRequest: (event) => events.push(event),
        readMonotonicTimeMs: createMonotonicClock([2, 7]),
      })
    )
    app.get("/boom", () => {
      throw new Error("boom")
    })

    const response = await app.request("/boom")

    expect(response.status).toBe(500)
    expect(events).toEqual([
      {
        durationMs: 5,
        method: "GET",
        path: "/boom",
        requestId: "failed-request-id",
        status: 500,
      },
    ])
  })
})

function createMonotonicClock(values: readonly number[]): () => number {
  let index = 0

  return () => {
    const value = values[index]

    if (value === undefined) {
      throw new Error("No monotonic clock value is available")
    }

    index += 1
    return value
  }
}

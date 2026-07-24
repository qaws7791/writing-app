import { Hono } from "hono"
import { describe, expect, it } from "vitest"
import { createRequestLoggingMiddleware } from "@workspace/http-platform/app"
import type { SecurityAuditEvent } from "@workspace/observability/security-audit-logger"

import { createSecurityAuditRequestObserver } from "@/observability/security-audit-request-observer"

describe("API security audit policy", () => {
  it("owner mutation을 platform request 관측과 분리해 기록한다", async () => {
    const audits: SecurityAuditEvent[] = []
    const app = new Hono()
    app.use(
      "*",
      createRequestLoggingMiddleware({
        audience: "admin",
        createRequestId: () => "request-id",
        logRequest: () => undefined,
        observeRequest: createSecurityAuditRequestObserver((event) =>
          audits.push(event)
        ),
        readActor: () => ({ id: "admin-1", type: "admin" }),
      })
    )
    app.patch("/users/user-1/status", (context) => context.json({ ok: true }))

    await app.request("/users/user-1/status?token=secret", { method: "PATCH" })

    expect(audits).toEqual([
      {
        action: "owner.mutation",
        actorId: "admin-1",
        actorType: "admin",
        outcome: "succeeded",
        requestId: "request-id",
        target: "PATCH /users/user-1/status",
      },
    ])
    expect(JSON.stringify(audits)).not.toContain("secret")
  })

  it("인증 실패·인가 거절·AI quota 거절을 서로 다른 audit action으로 분류한다", async () => {
    const audits: SecurityAuditEvent[] = []
    const app = new Hono()
    app.use(
      "*",
      createRequestLoggingMiddleware({
        audience: "learner",
        createRequestId: () => "request-id",
        logRequest: () => undefined,
        observeRequest: createSecurityAuditRequestObserver((event) =>
          audits.push(event)
        ),
      })
    )
    app.post("/api/auth/sign-in/email", (context) =>
      context.json({ ok: false }, 401)
    )
    app.get("/profile", (context) => context.json({ ok: false }, 403))
    app.post("/learning/steps/step-1/ai-feedback", (context) =>
      context.json({ ok: false }, 429)
    )

    await app.request("/api/auth/sign-in/email", { method: "POST" })
    await app.request("/profile")
    await app.request("/learning/steps/step-1/ai-feedback", {
      method: "POST",
    })

    expect(audits.map((event) => event.action)).toEqual([
      "authentication.failed",
      "authorization.denied",
      "ai.quota.exceeded",
    ])
  })
})

import { Hono } from "hono"
import { describe, expect, it } from "vitest"
import { createRequestLoggingMiddleware } from "@workspace/http-platform/request-logging"
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
        readActor: () => ({ id: "admin-1", role: "owner", type: "admin" }),
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
})

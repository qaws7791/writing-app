import type { Database } from "bun:sqlite"
import { Hono } from "hono"
import { describe, expect, it } from "vitest"

import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { AppError } from "@workspace/http-platform/errors"
import {
  adminSessionExpiresAt,
  type AdminSessionResolver,
} from "@workspace/identity/ports"
import type { AuditTrail } from "@workspace/operations/ports"

import type { AdminHonoEnv } from "@/http/admin-hono-env"
import { createAdminAuditMiddleware } from "@/observability/admin-audit.middleware"
import { createAuditTrailFixture } from "@/test-support/audit-trail-fixture"

const now = new Date("2026-07-24T00:00:00.000Z")
const adminCookie = "admin=valid"

describe("admin audit persistence", () => {
  it("blocks the mutation when the started audit event cannot be inserted", async () => {
    const fixture = openAuditTrail()

    try {
      rejectAuditStatement(fixture.sqlite, "INSERT")
      let mutationCount = 0
      const app = createAuditedFixture(fixture.auditTrail, () => {
        mutationCount += 1
      })

      const response = await app.request("/courses/course-1", {
        headers: adminHeaders("request-insert-failure"),
        method: "DELETE",
      })

      expect(response.status).toBe(503)
      expect(mutationCount).toBe(0)
      expect(readAuditRows(fixture.sqlite)).toEqual([])
    } finally {
      fixture.close()
    }
  })

  it("preserves the started event when the outcome update fails", async () => {
    const fixture = openAuditTrail()

    try {
      rejectAuditStatement(fixture.sqlite, "UPDATE")
      let mutationCount = 0
      const app = createAuditedFixture(fixture.auditTrail, () => {
        mutationCount += 1
      })

      const response = await app.request("/courses/course-1", {
        headers: adminHeaders("request-update-failure"),
        method: "DELETE",
      })

      expect(response.status).toBe(503)
      expect(mutationCount).toBe(1)
      expect(readAuditRows(fixture.sqlite)).toEqual([
        { outcome: "started", requestId: "request-update-failure" },
      ])
    } finally {
      fixture.close()
    }
  })
})

function openAuditTrail() {
  let sequence = 0
  return createAuditTrailFixture({
    clock: () => now,
    nextId: () => `audit-${++sequence}`,
  })
}

function createAuditedFixture(
  trail: AuditTrail,
  onMutation: () => void
): Hono<AdminHonoEnv> {
  const app = new Hono<AdminHonoEnv>()
  app.use("*", async (context, next) => {
    context.set(
      "requestId",
      context.req.header("x-request-id") ?? "request-default"
    )
    await next()
  })
  app.use(
    "*",
    createAdminAuditMiddleware({
      auditTrail: trail,
      sessionResolver: adminSessionResolver(),
    })
  )
  app.use("*", async (context, next) => {
    if (context.req.header("Cookie") !== adminCookie) {
      return context.json({ code: "UNAUTHORIZED" }, 401)
    }
    await next()
  })
  app.delete("/courses/:courseId", (context) => {
    onMutation()
    return context.json({ archived: true })
  })
  app.onError((error, context) =>
    error instanceof AppError
      ? context.json({ code: error.code }, error.status)
      : context.json({ code: "INTERNAL_ERROR" }, 500)
  )
  return app
}

function rejectAuditStatement(
  sqlite: Database,
  statement: "INSERT" | "UPDATE"
): void {
  sqlite.exec(`
    CREATE TRIGGER reject_audit_${statement.toLowerCase()}
    BEFORE ${statement} ON audit_events
    BEGIN
      SELECT RAISE(ABORT, 'audit unavailable');
    END;
  `)
}

function adminSessionResolver(): AdminSessionResolver {
  return {
    async resolveSession(headers) {
      if (headers.get("Cookie") !== adminCookie) return null
      return {
        admin: {
          email: "owner@example.test",
          id: adminIdSchema.parse("admin-1"),
          name: "owner",
        },
        [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
      }
    },
  }
}

function adminHeaders(requestId: string): HeadersInit {
  return {
    Cookie: adminCookie,
    "x-request-id": requestId,
    "x-writing-app-client-ip": "203.0.113.10",
  }
}

function readAuditRows(
  sqlite: Database
): readonly Readonly<{ outcome: string; requestId: string }>[] {
  return sqlite
    .query<{ readonly outcome: string; readonly requestId: string }, []>(
      "SELECT outcome, request_id AS requestId FROM audit_events ORDER BY created_at, id"
    )
    .all()
}

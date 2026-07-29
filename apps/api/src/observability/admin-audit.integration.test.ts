import { Hono } from "hono"
import { describe, expect, it } from "vitest"
import type { Database } from "bun:sqlite"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabase,
} from "@workspace/db/client"
import { AppError } from "@workspace/http-platform/errors"
import {
  adminSessionExpiresAt,
  type AdminSessionResolver,
} from "@workspace/identity/ports"
import { createOperationsModule } from "@workspace/operations/module"
import type {
  AuditEventFailureObserver,
  AuditTrail,
} from "@workspace/operations/ports"
import type { CourseId } from "@workspace/types/ids"

type AuditEventFailure = Parameters<AuditEventFailureObserver>[0]

function createTestAuditTrail(input: {
  readonly clock: () => Date
  readonly database: WritingAppDatabase
  readonly failureObserver?: AuditEventFailureObserver
  readonly nextId: () => string
  readonly reportingDatabase: Database
}): AuditTrail {
  return createOperationsModule({
    audit: {
      failureObserver: input.failureObserver ?? (() => undefined),
      idGenerator: { next: input.nextId },
    },
    clock: { now: input.clock },
    database: input.database,
    reportingDatabase: input.reportingDatabase,
    reportingFailureObserver: () => undefined,
  }).auditTrail
}

import type { AdminHonoEnv } from "@/http/admin-hono-env"
import { runApplicationMigrations } from "@/db/migrate"
import { createAdminAuditMiddleware } from "@/observability/admin-audit.middleware"

const now = new Date("2026-07-24T00:00:00.000Z")
const adminCookie = "admin=valid"

describe("관리자 DB audit SQLite + Hono integration", () => {
  it("대상 관리자 요청의 actor·target·성공/실패만 저장하고 PII payload는 저장하지 않는다", async () => {
    const client = createInMemoryWritingAppDatabase()
    const reportingClient = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(client.sqlite)
      let sequence = 0
      const trail = createTestAuditTrail({
        clock: () => now,
        database: client.db,
        nextId: () => `audit-${++sequence}`,
        reportingDatabase: reportingClient.sqlite,
      })
      const app = createAuditedFixture(trail)

      const requests = [
        new Request("http://localhost/users/user-1", {
          headers: adminHeaders("request-read"),
        }),
        new Request("http://localhost/users/user-1/status", {
          body: JSON.stringify({ status: "suspended" }),
          headers: adminHeaders("request-suspend", true),
          method: "PATCH",
        }),
        new Request("http://localhost/users/user-1/status", {
          body: JSON.stringify({ status: "active" }),
          headers: adminHeaders("request-activate", true),
          method: "PATCH",
        }),
        new Request("http://localhost/users/user-1", {
          headers: adminHeaders("request-delete"),
          method: "DELETE",
        }),
        new Request("http://localhost/courses/course-1/publish", {
          headers: adminHeaders("request-publish"),
          method: "POST",
        }),
        new Request("http://localhost/courses/course-1", {
          headers: adminHeaders("request-archive"),
          method: "DELETE",
        }),
      ]

      const responses = []
      for (const request of requests) {
        responses.push(await app.request(request))
      }
      expect(responses.map(({ status }) => status)).toEqual([
        200, 200, 409, 200, 200, 200,
      ])

      const rows = readAuditRows(client.sqlite)
      expect(
        rows.map(({ action, actorId, outcome, targetId }) => ({
          action,
          actorId,
          outcome,
          targetId,
        }))
      ).toEqual([
        {
          action: "learner.detail.read",
          actorId: "admin-1",
          outcome: "succeeded",
          targetId: "user-1",
        },
        {
          action: "learner.status.suspend",
          actorId: "admin-1",
          outcome: "succeeded",
          targetId: "user-1",
        },
        {
          action: "learner.status.activate",
          actorId: "admin-1",
          outcome: "failed",
          targetId: "user-1",
        },
        {
          action: "learner.delete",
          actorId: "admin-1",
          outcome: "succeeded",
          targetId: "user-1",
        },
        {
          action: "course.publish",
          actorId: "admin-1",
          outcome: "succeeded",
          targetId: "course-1",
        },
        {
          action: "course.archive",
          actorId: "admin-1",
          outcome: "succeeded",
          targetId: "course-1",
        },
      ])
      expect(rows.every(({ clientIp }) => clientIp === "203.0.113.10")).toBe(
        true
      )

      const columns = client.sqlite
        .query<{ readonly name: string }, []>(
          "SELECT name FROM pragma_table_info('audit_events')"
        )
        .all()
        .map(({ name }) => name)
      expect(columns).not.toEqual(
        expect.arrayContaining(["payload", "email", "name", "answer", "prompt"])
      )
      expect(JSON.stringify(rows)).not.toMatch(
        /person@example\.test|실명|원문 답안|system prompt/u
      )
      expect(readAuditIndexes(client.sqlite)).toEqual(
        expect.arrayContaining([
          "audit_events_query_idx",
          "audit_events_retention_purge_idx",
        ])
      )
    } finally {
      reportingClient.close()
      client.close()
    }
  })

  it("retention cutoff의 정확한 경계를 batch로 삭제하고 재실행을 안전하게 처리한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    const reportingClient = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(client.sqlite)
      let currentTime = new Date("2025-07-24T00:00:00.000Z")
      let sequence = 0
      const trail = createTestAuditTrail({
        clock: () => currentTime,
        database: client.db,
        nextId: () => `audit-${++sequence}`,
        reportingDatabase: reportingClient.sqlite,
      })

      await startAndCompleteCourseAudit(trail, "request-boundary")
      currentTime = new Date("2025-07-24T00:00:00.001Z")
      await startAndCompleteCourseAudit(trail, "request-recent")

      await expect(
        trail.purgeExpired({ batchSize: 1, cutoff: now })
      ).resolves.toMatchObject({ value: 1 })
      await expect(
        trail.purgeExpired({ batchSize: 1, cutoff: now })
      ).resolves.toMatchObject({ value: 0 })
      expect(readAuditRows(client.sqlite)).toMatchObject([
        {
          requestId: "request-recent",
          retentionUntil: 1_784_851_200_001,
        },
      ])
    } finally {
      reportingClient.close()
      client.close()
    }
  })

  it("사전 audit insert 실패 시 mutation을 실행하지 않고 인증 실패는 DB audit에서 제외한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    const reportingClient = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(client.sqlite)
      client.sqlite.exec(`
        CREATE TRIGGER reject_audit_insert
        BEFORE INSERT ON audit_events
        BEGIN
          SELECT RAISE(ABORT, 'audit unavailable');
        END;
      `)
      const observedFailures: AuditEventFailure[] = []
      const trail = createTestAuditTrail({
        clock: () => now,
        database: client.db,
        failureObserver: (failure) => {
          observedFailures.push(failure)
        },
        nextId: () => "audit-1",
        reportingDatabase: reportingClient.sqlite,
      })
      let mutationCount = 0
      const app = createAuditedFixture(trail, () => {
        mutationCount += 1
      })

      const failedAudit = await app.request("/courses/course-1", {
        headers: adminHeaders("request-1"),
        method: "DELETE",
      })
      const unauthenticated = await app.request("/courses/course-1", {
        headers: { "x-request-id": "request-2" },
        method: "DELETE",
      })

      expect(failedAudit.status).toBe(503)
      expect(mutationCount).toBe(0)
      expect(unauthenticated.status).toBe(401)
      expect(readAuditRows(client.sqlite)).toEqual([])
      expect(observedFailures).toMatchObject([
        { kind: "audit-event-persistence-failed", operation: "insert" },
      ])
      expect(observedFailures[0]?.cause).toBeInstanceOf(Error)
    } finally {
      reportingClient.close()
      client.close()
    }
  })

  it("outcome update 실패 시 started 흔적을 보존하고 성공 응답을 반환하지 않는다", async () => {
    const client = createInMemoryWritingAppDatabase()
    const reportingClient = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(client.sqlite)
      client.sqlite.exec(`
        CREATE TRIGGER reject_audit_update
        BEFORE UPDATE ON audit_events
        BEGIN
          SELECT RAISE(ABORT, 'audit unavailable');
        END;
      `)
      const trail = createTestAuditTrail({
        clock: () => now,
        database: client.db,
        nextId: () => "audit-1",
        reportingDatabase: reportingClient.sqlite,
      })
      let mutationCount = 0
      const app = createAuditedFixture(trail, () => {
        mutationCount += 1
      })

      const response = await app.request("/courses/course-1", {
        headers: adminHeaders("request-1"),
        method: "DELETE",
      })

      expect(response.status).toBe(503)
      expect(mutationCount).toBe(1)
      expect(readAuditRows(client.sqlite)).toMatchObject([
        { outcome: "started", requestId: "request-1" },
      ])
    } finally {
      reportingClient.close()
      client.close()
    }
  })
})

function createAuditedFixture(
  trail: AuditTrail,
  onMutation: () => void = () => {}
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
  app.get("/users/:userId", (context) =>
    context.json({
      email: "person@example.test",
      name: "실명",
    })
  )
  app.patch("/users/:userId/status", async (context) => {
    const body = await context.req.json<{ status: string }>()
    if (body.status === "active") {
      return context.json({ code: "CONFLICT" }, 409)
    }
    onMutation()
    return context.json({ changed: true })
  })
  app.delete("/users/:userId", (context) => {
    onMutation()
    return context.json({ deleted: true })
  })
  app.post("/courses/:courseId/publish", (context) => {
    onMutation()
    return context.json({ published: true })
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

function adminHeaders(requestId: string, json = false): HeadersInit {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Cookie: adminCookie,
    "x-request-id": requestId,
    "x-writing-app-client-ip": "203.0.113.10",
  }
}

async function startAndCompleteCourseAudit(
  trail: AuditTrail,
  requestId: string
): Promise<void> {
  const started = await trail.begin({
    action: "course.publish",
    actorId: adminIdSchema.parse("admin-1"),
    clientIp: null,
    requestId,
    target: {
      id: "course-1" as CourseId,
      type: "course",
    },
  })
  if (started.isErr()) throw new Error("audit fixture 저장에 실패했습니다.")

  const completed = await trail.complete({
    eventId: started.value.id,
    outcome: "succeeded",
  })
  if (completed.isErr()) throw new Error("audit fixture 종결에 실패했습니다.")
}

function readAuditRows(sqlite: Database): readonly Readonly<{
  action: string
  actorId: string
  clientIp: string | null
  outcome: string
  requestId: string
  retentionUntil: number
  targetId: string
}>[] {
  return sqlite
    .query<
      {
        readonly action: string
        readonly actorId: string
        readonly clientIp: string | null
        readonly outcome: string
        readonly requestId: string
        readonly retentionUntil: number
        readonly targetId: string
      },
      []
    >(`
      SELECT
        action,
        actor_id AS actorId,
        client_ip AS clientIp,
        outcome,
        request_id AS requestId,
        retention_until AS retentionUntil,
        target_id AS targetId
      FROM audit_events
      ORDER BY created_at, id
    `)
    .all()
}

function readAuditIndexes(sqlite: Database): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM pragma_index_list('audit_events')"
    )
    .all()
    .map(({ name }) => name)
}

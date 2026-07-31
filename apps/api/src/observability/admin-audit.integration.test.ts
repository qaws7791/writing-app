import { Hono } from "hono"
import { afterEach, describe, expect, it } from "vitest"
import type { Database } from "bun:sqlite"

import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { AppError } from "@workspace/http-platform/errors"
import {
  adminSessionExpiresAt,
  type AdminSessionResolver,
} from "@workspace/identity/ports"
import type {
  AuditEventFailureObserver,
  AuditTrail,
} from "@workspace/operations/ports"
import type { CourseId } from "@workspace/types/ids"

import type { AdminHonoEnv } from "@/http/admin-hono-env"
import { createAdminAuditMiddleware } from "@/observability/admin-audit.middleware"
import {
  createAuditTrailFixture,
  type AuditTrailFixture,
} from "@/test-support/audit-trail-fixture"

type AuditEventFailure = Parameters<AuditEventFailureObserver>[0]

const now = new Date("2026-07-24T00:00:00.000Z")
const adminCookie = "admin=valid"
const auditedClientIp = "203.0.113.10"
const learnerEmail = "person@example.test"
const learnerName = "실명"

/** audit_events_retention_check가 content-mutation category에 요구하는 보존 기간이다. */
const contentMutationAuditRetentionMs = 365 * 24 * 60 * 60 * 1_000

const forbiddenAuditColumnNames = [
  "answer",
  "email",
  "name",
  "payload",
  "prompt",
] as const

const openedFixtures: AuditTrailFixture[] = []

afterEach(() => {
  for (const fixture of openedFixtures.splice(0)) fixture.close()
})

describe("관리자 DB audit SQLite + Hono integration", () => {
  it.each(adminActionCases())(
    "$name 요청의 audit 결과를 독립적으로 저장한다",
    async ({ action, createRequest, outcome, status, targetId }) => {
      const { auditTrail, sqlite } = openAuditTrail()
      const app = createAuditedFixture(auditTrail)

      const response = await app.request(createRequest())

      expect(response.status).toBe(status)
      expect(readAuditRows(sqlite)).toMatchObject([
        {
          action,
          actorId: "admin-1",
          clientIp: auditedClientIp,
          outcome,
          targetId,
        },
      ])
    }
  )

  it.each(forbiddenAuditColumnNames)(
    "audit_events schema에 개인정보 컬럼 %s를 만들지 않는다",
    (forbiddenColumnName) => {
      expect(readAuditColumnNames(openAuditTrail().sqlite)).not.toContain(
        forbiddenColumnName
      )
    }
  )

  it("개인정보를 응답하는 관리자 조회도 audit 행에 개인정보 문자열을 남기지 않는다", async () => {
    const { auditTrail, sqlite } = openAuditTrail()
    const app = createAuditedFixture(auditTrail)

    const response = await app.request(
      new Request("http://localhost/users/user-1", {
        headers: adminHeaders("request-read"),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      email: learnerEmail,
      name: learnerName,
    })
    expect(JSON.stringify(readAuditRows(sqlite))).not.toMatch(
      new RegExp(`${learnerEmail}|${learnerName}`, "u")
    )
  })

  it("retention cutoff와 같은 시각의 event만 batch로 삭제하고 재실행은 0건을 반환한다", async () => {
    const boundaryAuditTime = new Date(
      now.getTime() - contentMutationAuditRetentionMs
    )
    const recentAuditTime = new Date(boundaryAuditTime.getTime() + 1)
    let currentTime = boundaryAuditTime
    const { auditTrail, sqlite } = openAuditTrail({ clock: () => currentTime })

    await startAndCompleteCourseAudit(auditTrail, "request-boundary")
    currentTime = recentAuditTime
    await startAndCompleteCourseAudit(auditTrail, "request-recent")

    await expect(
      auditTrail.purgeExpired({ batchSize: 1, cutoff: now })
    ).resolves.toMatchObject({ value: 1 })
    await expect(
      auditTrail.purgeExpired({ batchSize: 1, cutoff: now })
    ).resolves.toMatchObject({ value: 0 })
    expect(readAuditRows(sqlite)).toMatchObject([
      {
        requestId: "request-recent",
        retentionUntil:
          recentAuditTime.getTime() + contentMutationAuditRetentionMs,
      },
    ])
  })

  it("사전 audit insert 실패 시 mutation을 실행하지 않고 인증 실패는 DB audit에서 제외한다", async () => {
    const observedFailures: AuditEventFailure[] = []
    const { auditTrail, sqlite } = openAuditTrail({
      failureObserver: (failure) => {
        observedFailures.push(failure)
      },
    })
    rejectAuditStatement(sqlite, "INSERT")
    let mutationCount = 0
    const app = createAuditedFixture(auditTrail, () => {
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
    expect(readAuditRows(sqlite)).toEqual([])
    expect(observedFailures).toMatchObject([
      { kind: "audit-event-persistence-failed", operation: "insert" },
    ])
    expect(observedFailures[0]?.cause).toBeInstanceOf(Error)
  })

  it("outcome update 실패 시 started 흔적을 보존하고 성공 응답을 반환하지 않는다", async () => {
    const { auditTrail, sqlite } = openAuditTrail()
    rejectAuditStatement(sqlite, "UPDATE")
    let mutationCount = 0
    const app = createAuditedFixture(auditTrail, () => {
      mutationCount += 1
    })

    const response = await app.request("/courses/course-1", {
      headers: adminHeaders("request-1"),
      method: "DELETE",
    })

    expect(response.status).toBe(503)
    expect(mutationCount).toBe(1)
    expect(readAuditRows(sqlite)).toMatchObject([
      { outcome: "started", requestId: "request-1" },
    ])
  })
})

function openAuditTrail(
  input: {
    readonly clock?: () => Date
    readonly failureObserver?: AuditEventFailureObserver
  } = {}
): AuditTrailFixture {
  let sequence = 0
  const fixture = createAuditTrailFixture({
    clock: input.clock ?? (() => now),
    failureObserver: input.failureObserver,
    nextId: () => `audit-${++sequence}`,
  })
  openedFixtures.push(fixture)
  return fixture
}

function adminActionCases() {
  return [
    {
      action: "learner.detail.read",
      createRequest: () =>
        new Request("http://localhost/users/user-1", {
          headers: adminHeaders("request-read"),
        }),
      name: "학습자 상세 조회",
      outcome: "succeeded",
      status: 200,
      targetId: "user-1",
    },
    {
      action: "learner.status.suspend",
      createRequest: () =>
        new Request("http://localhost/users/user-1/status", {
          body: JSON.stringify({ status: "suspended" }),
          headers: adminHeaders("request-suspend", true),
          method: "PATCH",
        }),
      name: "학습자 정지",
      outcome: "succeeded",
      status: 200,
      targetId: "user-1",
    },
    {
      action: "learner.status.activate",
      createRequest: () =>
        new Request("http://localhost/users/user-1/status", {
          body: JSON.stringify({ status: "active" }),
          headers: adminHeaders("request-activate", true),
          method: "PATCH",
        }),
      name: "학습자 활성화 실패",
      outcome: "failed",
      status: 409,
      targetId: "user-1",
    },
    {
      action: "learner.delete",
      createRequest: () =>
        new Request("http://localhost/users/user-1", {
          headers: adminHeaders("request-delete"),
          method: "DELETE",
        }),
      name: "학습자 삭제",
      outcome: "succeeded",
      status: 200,
      targetId: "user-1",
    },
    {
      action: "course.publish",
      createRequest: () =>
        new Request("http://localhost/courses/course-1/publish", {
          headers: adminHeaders("request-publish"),
          method: "POST",
        }),
      name: "코스 발행",
      outcome: "succeeded",
      status: 200,
      targetId: "course-1",
    },
    {
      action: "course.archive",
      createRequest: () =>
        new Request("http://localhost/courses/course-1", {
          headers: adminHeaders("request-archive"),
          method: "DELETE",
        }),
      name: "코스 보관",
      outcome: "succeeded",
      status: 200,
      targetId: "course-1",
    },
  ] as const
}

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
      email: learnerEmail,
      name: learnerName,
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

function adminHeaders(requestId: string, json = false): HeadersInit {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Cookie: adminCookie,
    "x-request-id": requestId,
    "x-writing-app-client-ip": auditedClientIp,
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
  const completed = await trail.complete({
    eventId: started._unsafeUnwrap().id,
    outcome: "succeeded",
  })
  completed._unsafeUnwrap()
}

function readAuditColumnNames(sqlite: Database): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM pragma_table_info('audit_events')"
    )
    .all()
    .map(({ name }) => name)
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

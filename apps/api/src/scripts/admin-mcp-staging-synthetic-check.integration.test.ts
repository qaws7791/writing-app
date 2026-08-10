import { adminAuthUsers } from "@workspace/auth/schema"
import type { FetchLike } from "@modelcontextprotocol/client"
import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
} from "@workspace/contracts/content/ids"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { ok, type Result } from "@workspace/kernel/result"
import type { OperationsModule } from "@workspace/operations/module"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { runApplicationMigrations } from "@/db/migrate"
import { createAdminMcpAccessTokenStore } from "@/mcp/admin/admin-mcp-access-token-store"
import { createAdminMcpAuthentication } from "@/mcp/admin/admin-mcp-auth"
import {
  adminMcpDraftScope,
  adminMcpReadScope,
  type AdminMcpConfiguration,
} from "@/mcp/admin/admin-mcp-configuration"
import { createAdminMcpRuntime } from "@/mcp/admin/admin-mcp-runtime"
import {
  AdminMcpSyntheticCheckError,
  parseAdminMcpSyntheticEnvironment,
  runAdminMcpSyntheticCheck,
} from "@/scripts/admin-mcp-staging-synthetic-check"

type RuntimeInput = Parameters<typeof createAdminMcpRuntime>[0]
type ReadAuditResult = Awaited<
  ReturnType<OperationsModule["auditTrail"]["readEvents"]>
>
type AuditPage =
  ReadAuditResult extends Result<infer Value, unknown> ? Value : never

const resourceUrl = "https://mcp.staging.example.com/mcp/admin"
const adminId = adminIdSchema.parse("admin-owner")
const courseId = courseIdSchema.parse("course-1")
const curriculumVersionId = curriculumVersionIdSchema.parse("curriculum-1")
const lessonId = lessonIdSchema.parse("lesson-1")
const createdAt = new Date("2026-08-10T00:00:00.000Z")
const expiresAt = new Date("2026-08-11T00:00:00.000Z")
const expectedReadToolNames = [
  "admin_list_courses",
  "admin_get_course_editor",
  "admin_get_dashboard",
  "admin_get_analytics",
  "admin_list_lesson_analytics",
  "admin_get_ai_feedback_quality",
  "admin_list_audit_events",
]
const configuration: AdminMcpConfiguration = {
  changes: undefined,
  resourceUrl,
}

describe("admin MCP staging synthetic check local integration", () => {
  let client: WritingAppDatabaseClient
  let now: Date

  beforeEach(() => {
    client = createInMemoryWritingAppDatabase()
    runApplicationMigrations(client.sqlite)
    client.db
      .insert(adminAuthUsers)
      .values({
        createdAt,
        email: "admin-owner@example.com",
        emailVerified: true,
        id: adminId,
        image: null,
        name: "Admin Owner",
        updatedAt: createdAt,
      })
      .run()
    now = createdAt
  })

  afterEach(() => client.close())

  it("connects the static token store to the pinned v2 client", async () => {
    const store = createAdminMcpAccessTokenStore(client.db)
    const issued = await store.issue({
      actorAdminId: adminId,
      createdAt,
      expiresAt,
      ownerAdminId: adminId,
      scopes: [adminMcpReadScope],
    })
    expect(issued.kind).toBe("issued")
    if (issued.kind !== "issued") return

    const tools = createToolDependencies()
    const runtime = createAdminMcpRuntime({
      authentication: createAdminMcpAuthentication({
        accessTokenStore: store,
        configuration,
        now: () => now,
      }),
      configuration,
      requestLogger: vi.fn(),
      securityAuditLogger: vi.fn(),
      tools,
    })
    const protocolVersions: string[] = []
    let requestSequence = 0
    const routedFetch: FetchLike = async (input, init) => {
      const request = new Request(input, init)
      const protocolVersion = request.headers.get("mcp-protocol-version")
      if (protocolVersion !== null) protocolVersions.push(protocolVersion)
      const headers = new Headers(request.headers)
      headers.set("host", new URL(resourceUrl).host)
      return runtime.fetch(new Request(request, { headers }), {
        requestId: `local-synthetic-${++requestSequence}`,
      })
    }

    try {
      const syntheticConfiguration = parseAdminMcpSyntheticEnvironment({
        ADMIN_MCP_SYNTHETIC_BEARER_TOKEN: issued.token,
        ADMIN_MCP_SYNTHETIC_RESOURCE_URL: resourceUrl,
      })
      const result = await runAdminMcpSyntheticCheck(syntheticConfiguration, {
        fetch: routedFetch,
      })

      expect(result).toEqual({
        protocolEra: "modern",
        readToolName: "admin_list_courses",
        toolCount: 7,
        toolNames: expectedReadToolNames,
      })
      expect(protocolVersions).toContain("2026-07-28")
      expect(tools.content.getCourses).toHaveBeenCalledOnce()
    } finally {
      await runtime.close()
    }
  })

  it("rejects a write-scoped token that exposes additional tools", async () => {
    const writeConfiguration: AdminMcpConfiguration = {
      changes: {
        adminOrigin: "https://admin.staging.example.com",
        approvalTtlMs: 5 * 60 * 1_000,
        executionLeaseMs: 30 * 1_000,
        requestStateSecret: "synthetic-test-request-state-secret-32-bytes",
      },
      resourceUrl,
    }
    const store = createAdminMcpAccessTokenStore(client.db)
    const issued = await store.issue({
      actorAdminId: adminId,
      createdAt,
      expiresAt,
      ownerAdminId: adminId,
      scopes: [adminMcpReadScope, adminMcpDraftScope],
    })
    expect(issued.kind).toBe("issued")
    if (issued.kind !== "issued") return

    const tools = createToolDependencies()
    const runtime = createAdminMcpRuntime({
      authentication: createAdminMcpAuthentication({
        accessTokenStore: store,
        configuration: writeConfiguration,
        now: () => now,
      }),
      configuration: writeConfiguration,
      requestLogger: vi.fn(),
      securityAuditLogger: vi.fn(),
      tools,
    })
    let requestSequence = 0
    const routedFetch: FetchLike = async (input, init) => {
      const request = new Request(input, init)
      const headers = new Headers(request.headers)
      headers.set("host", new URL(resourceUrl).host)
      return runtime.fetch(new Request(request, { headers }), {
        requestId: `write-scoped-synthetic-${++requestSequence}`,
      })
    }

    try {
      await expect(
        runAdminMcpSyntheticCheck(
          {
            bearerToken: issued.token,
            resourceUrl: new URL(resourceUrl),
          },
          { fetch: routedFetch }
        )
      ).rejects.toThrow(
        new AdminMcpSyntheticCheckError(
          "관리자 MCP staging synthetic 도구 집합이 읽기 전용 7개 계약과 일치하지 않습니다."
        )
      )
      expect(tools.content.getCourses).not.toHaveBeenCalled()
    } finally {
      await runtime.close()
    }
  })

  it.each(["revoked", "expired"] as const)(
    "returns 401 for a %s static token",
    async (credentialState) => {
      const store = createAdminMcpAccessTokenStore(client.db)
      const issued = await store.issue({
        actorAdminId: adminId,
        createdAt,
        expiresAt,
        ownerAdminId: adminId,
        scopes: [adminMcpReadScope],
      })
      expect(issued.kind).toBe("issued")
      if (issued.kind !== "issued") return

      if (credentialState === "revoked") {
        await expect(
          store.revoke({
            actorAdminId: adminId,
            credentialId: issued.credentialId,
            revokedAt: createdAt,
          })
        ).resolves.toEqual({ kind: "revoked" })
      } else {
        now = expiresAt
      }

      const runtime = createAdminMcpRuntime({
        authentication: createAdminMcpAuthentication({
          accessTokenStore: store,
          configuration,
          now: () => now,
        }),
        configuration,
        requestLogger: vi.fn(),
        securityAuditLogger: vi.fn(),
        tools: createToolDependencies(),
      })

      try {
        const response = await runtime.fetch(
          new Request(resourceUrl, {
            body: "{}",
            headers: {
              authorization: `Bearer ${issued.token}`,
              "content-type": "application/json",
              host: new URL(resourceUrl).host,
            },
            method: "POST",
          }),
          { requestId: `${credentialState}-token-request` }
        )

        expect(response.status).toBe(401)
        expect(response.headers.get("www-authenticate")).toContain("Bearer")
        expect(response.headers.get("www-authenticate")).not.toContain(
          "resource_metadata"
        )
      } finally {
        await runtime.close()
      }
    }
  )
})

function createToolDependencies(): RuntimeInput["tools"] {
  const auditEvent: AuditPage["items"][number] = {
    action: "course.publish",
    actorId: adminId,
    category: "content-mutation",
    clientIp: "127.0.0.1",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    id: "audit-1" as AuditPage["items"][number]["id"],
    mcp: null,
    outcome: "succeeded",
    requestId: "source-request-1",
    retentionUntil: new Date("2027-08-01T00:00:00.000Z"),
    target: { id: courseId, type: "course" },
  }
  const auditTrail: OperationsModule["auditTrail"] = {
    begin: vi.fn(async () => ok(auditEvent)),
    beginMcp: vi.fn(async () => ok(auditEvent)),
    complete: vi.fn(async () => ok(undefined)),
    ensureMcpStarted: vi.fn(async () => ok(auditEvent)),
    inspectExpired: vi.fn(async () => ok(0)),
    purgeExpired: vi.fn(async () => ok(0)),
    readEvents: vi.fn(async (query) =>
      ok({
        items: [auditEvent],
        page: query.page,
        pageSize: query.pageSize,
        totalItems: 1,
        totalPages: 1,
      })
    ),
  }

  return {
    adminMcpApprovals: {
      claim: vi.fn(async () => {
        throw new Error("unexpected approval claim")
      }),
      complete: vi.fn(async () => {
        throw new Error("unexpected approval completion")
      }),
      decide: vi.fn(async () => {
        throw new Error("unexpected approval decision")
      }),
      readForOwner: vi.fn(async () => {
        throw new Error("unexpected approval read")
      }),
      request: vi.fn(async () => {
        throw new Error("unexpected approval request")
      }),
    },
    auditTrail,
    content: {
      executeApprovedMcpChange: vi.fn(async () => {
        throw new Error("unexpected content change")
      }),
      executeAutomaticMcpChange: vi.fn(async () => {
        throw new Error("unexpected automatic content change")
      }),
      getCourseChangeTarget: vi.fn(async () => {
        throw new Error("unexpected change target read")
      }),
      getCourseEditor: vi.fn(async () => ({
        assets: [],
        category: "writing",
        courseId,
        coverAssetId: null,
        curriculumVersionId,
        description: "private-course-description",
        editVersion: 0,
        revision: 1,
        title: "private-course-title",
        units: [],
      })),
      getCourses: vi.fn(async (query) => ({
        items: [
          {
            category: "writing",
            cover: null,
            id: courseId,
            lessonCount: 1,
            revision: 1,
            status: "active" as const,
            title: "private-course-title",
            unitCount: 1,
            visualKey: "essay-writing" as const,
          },
        ],
        page: query.page,
        pageSize: query.pageSize,
        totalItems: 1,
        totalPages: 1,
      })),
      readApprovedMcpChangeReceipt: vi.fn(async () => {
        throw new Error("unexpected content receipt read")
      }),
    },
    identity: {
      application: {
        changeUserStatus: vi.fn(async () => {
          throw new Error("unexpected user status change")
        }),
        deleteUser: vi.fn(async () => {
          throw new Error("unexpected user deletion")
        }),
      },
      learningQuery: {
        readLearnerStatus: vi.fn(async () => {
          throw new Error("unexpected user status read")
        }),
      },
    },
    now: () => new Date("2026-08-10T00:00:00.000Z"),
    reportUnexpectedError: vi.fn(),
    reporting: {
      readAiFeedbackQuality: vi.fn(async ({ from, to }) =>
        ok({
          failureCount: 0,
          failureCounts: [],
          from: from.toISOString(),
          latency: { averageMs: null, sampleCount: 0, totalMs: 0 },
          requestCount: 0,
          retryCount: 0,
          status: "empty" as const,
          successCount: 0,
          successRate: null,
          to: to.toISOString(),
          tokens: { input: 0, output: 0, sampleCount: 0 },
        })
      ),
      readAnalytics: vi.fn(async () =>
        ok({
          dailySeries: [],
          from: "2026-07-12",
          matureCohortThrough: "2026-08-02",
          to: "2026-08-10",
          worstAiFeedbackLessons: [],
          worstLessons: [],
        })
      ),
      readDashboard: vi.fn(async () =>
        ok({
          activeWindow: { from: "2026-08-04", to: "2026-08-10" },
          asOfDate: "2026-08-10",
          metrics: {
            activeUsersLast7Days: 0,
            activationRate: {
              denominator: 0,
              numerator: 0,
              percentage: null,
              status: "empty" as const,
            },
            completedLessons: 0,
            d7ReturnRate: {
              denominator: 0,
              matureCohortThrough: "2026-08-02",
              numerator: 0,
              percentage: null,
              status: "empty" as const,
            },
            writingRevisionAfterSelfCheckRate: {
              denominator: 0,
              numerator: 0,
              percentage: null,
              status: "empty" as const,
            },
            writingSelfCheckStartRate: {
              denominator: 0,
              numerator: 0,
              percentage: null,
              status: "empty" as const,
            },
          },
        })
      ),
      readLessonAnalytics: vi.fn(async (query) =>
        ok({
          items: [
            {
              completed: 0,
              completionRate: 0,
              courseId,
              courseTitle: "private-course-title",
              dropOffRate: 0,
              lessonId,
              lessonTitle: "private-lesson-title",
              started: 0,
            },
          ],
          page: query.page,
          pageSize: query.pageSize,
          totalItems: 1,
          totalPages: 1,
        })
      ),
    },
  }
}

import {
  Client,
  isJSONRPCRequest,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client"
import {
  adminIdSchema,
  userIdSchema,
} from "@workspace/contracts/identity/admin-ids"
import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
} from "@workspace/contracts/content/ids"
import { adminMcpApprovalIdSchema } from "@workspace/contracts/operations/admin-mcp-approvals"
import { ok, type Result } from "@workspace/kernel/result"
import type { OperationsModule } from "@workspace/operations/module"
import type { AdminMcpApproval } from "@workspace/operations/ports"
import { Hono } from "hono"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  adminMcpRequestBodyLimitBytes,
  createUnifiedApp,
} from "@/http/unified-app"
import type { AdminMcpAuthentication } from "@/mcp/admin/admin-mcp-auth"
import type { AdminMcpConfiguration } from "@/mcp/admin/admin-mcp-configuration"
import {
  adminMcpDraftScope,
  adminMcpLifecycleScope,
  adminMcpPublishScope,
  adminMcpUserDeleteScope,
  adminMcpUserStatusScope,
} from "@/mcp/admin/admin-mcp-configuration"
import {
  createAdminMcpRuntime,
  type AdminMcpRuntime,
} from "@/mcp/admin/admin-mcp-runtime"

type RuntimeInput = Parameters<typeof createAdminMcpRuntime>[0]
type ReadAuditResult = Awaited<
  ReturnType<OperationsModule["auditTrail"]["readEvents"]>
>
type AuditPage =
  ReadAuditResult extends Result<infer Value, unknown> ? Value : never

const resourceUrl = "http://localhost:8787/mcp/admin"
const adminId = adminIdSchema.parse("admin-owner")
const courseId = courseIdSchema.parse("course-1")
const curriculumVersionId = curriculumVersionIdSchema.parse("curriculum-1")
const lessonId = lessonIdSchema.parse("lesson-1")
const userId = userIdSchema.parse("user-1")
const approvalId = adminMcpApprovalIdSchema.parse(
  "admin-mcp-approval-runtime-test"
)
const maximumCourseDraftDocumentBytes = 256 * 1_024

const configuration: AdminMcpConfiguration = {
  changes: undefined,
  resourceUrl,
}

const openRuntimes: AdminMcpRuntime[] = []

afterEach(async () => {
  await Promise.all(openRuntimes.splice(0).map((runtime) => runtime.close()))
})

describe("admin MCP runtime", () => {
  it("serves exactly six read-only tools through the v2 MCP client", async () => {
    const requestLogs: unknown[] = []
    const securityLogs: unknown[] = []
    const tools = createToolDependencies()
    const runtime = createRuntime({
      requestLogger: (event) => requestLogs.push(event),
      securityAuditLogger: (event) => securityLogs.push(event),
      tools,
    })
    const responseCacheControls: string[] = []
    const protocolRequests: Array<{
      readonly method: string
      readonly protocolVersion: string | null
    }> = []
    let requestSequence = 0
    const transport = new StreamableHTTPClientTransport(new URL(resourceUrl), {
      authProvider: { token: async () => "super-secret-token" },
      fetch: async (input, init) => {
        const outgoing = new Request(input, init)
        const message: unknown = await outgoing.clone().json()
        if (isJSONRPCRequest(message)) {
          protocolRequests.push({
            method: message.method,
            protocolVersion: outgoing.headers.get("mcp-protocol-version"),
          })
        }
        const headers = new Headers(outgoing.headers)
        headers.set("host", new URL(resourceUrl).host)
        const response = await runtime.fetch(
          new Request(outgoing, { headers }),
          { requestId: `mcp-request-${++requestSequence}` }
        )
        responseCacheControls.push(response.headers.get("cache-control") ?? "")
        return response
      },
      onInsufficientScope: "throw",
    })
    const client = new Client(
      { name: "admin-mcp-test-client", version: "1.0.0" },
      { versionNegotiation: { mode: { pin: "2026-07-28" } } }
    )

    try {
      await client.connect(transport)
      expect(client.getProtocolEra()).toBe("modern")
      const listed = await client.listTools()
      expect(listed.tools.map((tool) => tool.name)).toEqual([
        "admin_list_courses",
        "admin_get_course_editor",
        "admin_get_dashboard",
        "admin_get_analytics",
        "admin_list_lesson_analytics",
        "admin_list_audit_events",
      ])
      for (const tool of listed.tools) {
        expect(tool.annotations).toMatchObject({
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
          readOnlyHint: true,
        })
      }

      await expectSuccessfulCall(client, "admin_list_courses", {
        query: "sensitive-query",
      })
      await expectSuccessfulCall(client, "admin_get_course_editor", {
        courseId,
      })
      await expectSuccessfulCall(client, "admin_get_dashboard", {})
      await expectSuccessfulCall(client, "admin_get_analytics", { days: 30 })
      await expectSuccessfulCall(client, "admin_list_lesson_analytics", {})
      const auditResult = await expectSuccessfulCall(
        client,
        "admin_list_audit_events",
        {}
      )
      expect(auditResult.structuredContent).toMatchObject({
        items: [
          {
            action: "course.publish",
            actorId: adminId,
            id: "audit-1",
          },
        ],
      })
      expect(JSON.stringify(auditResult.structuredContent)).not.toContain(
        "clientIp"
      )
    } finally {
      await client.close()
    }

    expect(tools.content.getCourses).toHaveBeenCalledOnce()
    expect(tools.content.getCourseEditor).toHaveBeenCalledOnce()
    expect(tools.reporting.readDashboard).toHaveBeenCalledOnce()
    expect(tools.reporting.readAnalytics).toHaveBeenCalledOnce()
    expect(tools.reporting.readLessonAnalytics).toHaveBeenCalledOnce()
    expect(tools.auditTrail.readEvents).toHaveBeenCalledOnce()
    expect(securityLogs).toEqual([])
    expect(protocolRequests[0]).toEqual({
      method: "server/discover",
      protocolVersion: "2026-07-28",
    })
    expect(protocolRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "tools/list" }),
        expect.objectContaining({ method: "tools/call" }),
      ])
    )
    expect(
      protocolRequests.every(
        (request) => request.protocolVersion === "2026-07-28"
      )
    ).toBe(true)
    expect(
      responseCacheControls.every((value) => value === "private, no-store")
    ).toBe(true)
    expect(requestLogs).toContainEqual(
      expect.objectContaining({
        actorId: adminId,
        audience: "admin-mcp",
        mcpCredentialId: "approved-agent-client",
      })
    )
    const serializedLogs = JSON.stringify(requestLogs)
    expect(serializedLogs).not.toContain("super-secret-token")
    expect(serializedLogs).not.toContain("sensitive-query")
    expect(serializedLogs).not.toContain("private-course-title")
  })

  it("accepts a 256 KiB draft document through the unified modern endpoint", async () => {
    const tools = createToolDependencies()
    vi.mocked(tools.content.executeAutomaticMcpChange).mockImplementation(
      async (input) =>
        ok({
          receipt: {
            adminId,
            courseId,
            createdAt: new Date("2026-08-10T00:00:03.000Z"),
            executionId: input.executionId,
            idempotencyKey: input.idempotencyKey,
            inputDigest: input.inputDigest,
            mcpCredentialId: "approved-agent-client",
            resultKind:
              input.kind === "save-course-draft"
                ? "course-draft-saved"
                : "course-created",
            toolName: input.toolName,
          },
          replayed: false,
        })
    )
    const changeConfiguration: AdminMcpConfiguration = {
      ...configuration,
      changes: {
        adminOrigin: "http://localhost:3001",
        approvalTtlMs: 5 * 60 * 1_000,
        executionLeaseMs: 30 * 1_000,
        requestStateSecret: "runtime-test-request-state-secret-with-32-bytes",
      },
    }
    const runtime = createRuntime({
      configuration: changeConfiguration,
      scopes: ["admin:mcp:read", adminMcpDraftScope],
      tools,
    })
    const toolCallRequestSizes: number[] = []
    let requestSequence = 0
    const transport = createUnifiedClientTransport(
      runtime,
      () => `mcp-change-request-${++requestSequence}`,
      {
        async observeRequest(request) {
          const body = await request.text()
          const message: unknown = JSON.parse(body)
          if (isJSONRPCRequest(message) && message.method === "tools/call") {
            toolCallRequestSizes.push(serializedByteLength(body))
          }
        },
      }
    )
    const client = new Client(
      { name: "admin-mcp-change-test-client", version: "1.0.0" },
      {
        capabilities: { elicitation: { url: {} } },
        versionNegotiation: { mode: { pin: "2026-07-28" } },
      }
    )
    const approvalRequests: unknown[] = []
    client.setRequestHandler("elicitation/create", async (request) => {
      approvalRequests.push(request.params)
      return { action: "accept" }
    })

    try {
      await client.connect(transport)
      const listed = await client.listTools()
      expect(listed.tools.map((tool) => tool.name)).toEqual([
        "admin_list_courses",
        "admin_get_course_editor",
        "admin_get_dashboard",
        "admin_get_analytics",
        "admin_list_lesson_analytics",
        "admin_list_audit_events",
        "admin_create_course_draft",
        "admin_save_course_draft",
      ])

      const result = await client.callTool({
        arguments: { idempotencyKey: "create-course-runtime-test" },
        name: "admin_create_course_draft",
      })
      expect(result.isError).not.toBe(true)
      expect(result.structuredContent).toMatchObject({
        course: { id: courseId },
        executionId: expect.stringMatching(/^admin-mcp-execution-/u),
        replayed: false,
      })

      const document = createMaximumSizedCourseDraftDocument()
      expect(serializedByteLength(document)).toBe(
        maximumCourseDraftDocumentBytes
      )
      const saved = await client.callTool({
        arguments: {
          document,
          expectedEditVersion: 0,
          idempotencyKey: "save-course-runtime-test",
        },
        name: "admin_save_course_draft",
      })
      expect(saved.isError).not.toBe(true)
      expect(saved.structuredContent).toMatchObject({
        course: { id: courseId },
        executionId: expect.stringMatching(/^admin-mcp-execution-/u),
        replayed: false,
      })
    } finally {
      await client.close()
    }

    expect(approvalRequests).toEqual([])
    expect(tools.adminMcpApprovals.request).not.toHaveBeenCalled()
    expect(tools.adminMcpApprovals.claim).not.toHaveBeenCalled()
    expect(tools.content.executeAutomaticMcpChange).toHaveBeenCalledTimes(2)
    expect(tools.auditTrail.beginMcp).toHaveBeenCalledTimes(2)
    expect(tools.auditTrail.complete).toHaveBeenCalledTimes(2)
    expect(tools.adminMcpApprovals.complete).not.toHaveBeenCalled()
    expect(Math.max(...toolCallRequestSizes)).toBeGreaterThan(
      maximumCourseDraftDocumentBytes
    )
    expect(Math.max(...toolCallRequestSizes)).toBeLessThanOrEqual(
      adminMcpRequestBodyLimitBytes
    )
  })

  it("rejects an MCP JSON-RPC request above 320 KiB at the unified boundary", async () => {
    const tools = createToolDependencies()
    const changeConfiguration: AdminMcpConfiguration = {
      ...configuration,
      changes: {
        adminOrigin: "http://localhost:3001",
        approvalTtlMs: 5 * 60 * 1_000,
        executionLeaseMs: 30 * 1_000,
        requestStateSecret: "runtime-test-request-state-secret-with-32-bytes",
      },
    }
    const runtime = createRuntime({
      configuration: changeConfiguration,
      scopes: ["admin:mcp:read", adminMcpDraftScope],
      tools,
    })
    const requestSizes: number[] = []
    const responseStatuses: number[] = []
    let requestSequence = 0
    const transport = createUnifiedClientTransport(
      runtime,
      () => `oversized-mcp-request-${++requestSequence}`,
      {
        async observeRequest(request) {
          requestSizes.push(serializedByteLength(await request.text()))
        },
        observeResponse(response) {
          responseStatuses.push(response.status)
        },
      }
    )
    const client = new Client(
      { name: "admin-mcp-body-limit-test-client", version: "1.0.0" },
      { versionNegotiation: { mode: { pin: "2026-07-28" } } }
    )

    try {
      await client.connect(transport)
      await expect(
        client.callTool({
          arguments: {
            document: {
              ...createMaximumSizedCourseDraftDocument(),
              description: "x".repeat(adminMcpRequestBodyLimitBytes),
            },
            expectedEditVersion: 0,
            idempotencyKey: "oversized-save-course-runtime-test",
          },
          name: "admin_save_course_draft",
        })
      ).rejects.toThrow()
    } finally {
      await client.close()
    }

    expect(Math.max(...requestSizes)).toBeGreaterThan(
      adminMcpRequestBodyLimitBytes
    )
    expect(responseStatuses).toContain(413)
    expect(tools.content.executeAutomaticMcpChange).not.toHaveBeenCalled()
  })

  it("rejects request state replay from a different MCP credential", async () => {
    const tools = createToolDependencies()
    let mcpCredentialId = "approved-agent-client"
    vi.mocked(tools.adminMcpApprovals.request).mockImplementation(
      async (input) =>
        ok({
          approval: createApproval({
            inputDigest: input.inputDigest,
            status: "pending",
            target: {
              courseId,
              editVersion: 0,
              expectedStatus: "active",
              kind: "course-lifecycle",
              title: "강의",
            },
            toolName: "admin_archive_course",
          }),
          created: true,
        })
    )
    const runtime = createRuntime({
      configuration: {
        ...configuration,
        changes: {
          adminOrigin: "http://localhost:3001",
          approvalTtlMs: 5 * 60 * 1_000,
          executionLeaseMs: 30 * 1_000,
          requestStateSecret: "runtime-test-request-state-secret-with-32-bytes",
        },
      },
      mcpCredentialId: () => mcpCredentialId,
      scopes: ["admin:mcp:read", "admin:mcp:lifecycle"],
      tools,
    })
    vi.mocked(tools.content.getCourseChangeTarget).mockResolvedValue({
      courseId,
      editVersion: 0,
      status: "active",
      title: "강의",
    })
    const transport = createClientTransport(
      runtime,
      () => "request-state-binding-test"
    )
    const client = new Client(
      { name: "admin-mcp-binding-test-client", version: "1.0.0" },
      {
        capabilities: { elicitation: { url: {} } },
        versionNegotiation: { mode: { pin: "2026-07-28" } },
      }
    )
    client.setRequestHandler("elicitation/create", async () => {
      mcpCredentialId = "different-agent-client"
      return { action: "accept" }
    })

    try {
      await client.connect(transport)
      await expect(
        client.callTool({
          arguments: {
            courseId,
            idempotencyKey: "request-state-binding-test",
          },
          name: "admin_archive_course",
        })
      ).rejects.toThrow()
    } finally {
      await client.close()
    }

    expect(tools.adminMcpApprovals.request).toHaveBeenCalledOnce()
    expect(tools.adminMcpApprovals.claim).not.toHaveBeenCalled()
    expect(tools.content.executeApprovedMcpChange).not.toHaveBeenCalled()
  })

  it("serves read tools to a stateless legacy client", async () => {
    const reportProtocolError = vi.fn()
    const tools = createToolDependencies()
    const runtime = createRuntime({
      configuration: {
        ...configuration,
        changes: {
          adminOrigin: "http://localhost:3001",
          approvalTtlMs: 5 * 60 * 1_000,
          executionLeaseMs: 30 * 1_000,
          requestStateSecret: "runtime-test-request-state-secret-with-32-bytes",
        },
      },
      reportProtocolError,
      scopes: ["admin:mcp:read", adminMcpDraftScope, "admin:mcp:lifecycle"],
      tools,
    })
    const protocolMethods: string[] = []
    const responseStatuses: number[] = []
    const transport = createClientTransport(
      runtime,
      () => "legacy-initialize-request",
      async (request) => {
        const message: unknown = await request.json()
        if (isJSONRPCRequest(message)) protocolMethods.push(message.method)
      },
      (response) => {
        responseStatuses.push(response.status)
      }
    )
    const client = new Client(
      { name: "admin-mcp-legacy-test-client", version: "1.0.0" },
      { versionNegotiation: { mode: "legacy" } }
    )

    try {
      await client.connect(transport)
      expect(client.getProtocolEra()).toBe("legacy")
      const listed = await client.listTools()
      expect(listed.tools.map((tool) => tool.name)).toEqual([
        "admin_list_courses",
        "admin_get_course_editor",
        "admin_get_dashboard",
        "admin_get_analytics",
        "admin_list_lesson_analytics",
        "admin_list_audit_events",
      ])
      await expectSuccessfulCall(client, "admin_list_courses", {})
    } finally {
      await client.close()
    }

    expect(protocolMethods).toEqual(["initialize", "tools/list", "tools/call"])
    expect(responseStatuses).toEqual([200, 202, 200, 200])
    expect(tools.content.getCourses).toHaveBeenCalledOnce()
    expect(reportProtocolError).not.toHaveBeenCalled()
  })

  it("exposes only lifecycle mutations to a lifecycle-scoped modern client", async () => {
    const runtime = createRuntime({
      configuration: {
        ...configuration,
        changes: {
          adminOrigin: "http://localhost:3001",
          approvalTtlMs: 5 * 60 * 1_000,
          executionLeaseMs: 30 * 1_000,
          requestStateSecret: "runtime-test-request-state-secret-with-32-bytes",
        },
      },
      scopes: ["admin:mcp:read", "admin:mcp:lifecycle"],
    })
    const transport = createClientTransport(
      runtime,
      () => "lifecycle-tool-list-request"
    )
    const client = new Client(
      { name: "admin-mcp-lifecycle-test-client", version: "1.0.0" },
      { versionNegotiation: { mode: { pin: "2026-07-28" } } }
    )

    try {
      await client.connect(transport)
      const listed = await client.listTools()
      expect(listed.tools.map((tool) => tool.name)).toEqual([
        "admin_list_courses",
        "admin_get_course_editor",
        "admin_get_dashboard",
        "admin_get_analytics",
        "admin_list_lesson_analytics",
        "admin_list_audit_events",
        "admin_archive_course",
        "admin_restore_course",
      ])
      expect(
        listed.tools.find((tool) => tool.name === "admin_archive_course")
          ?.annotations
      ).toMatchObject({ destructiveHint: true, readOnlyHint: false })
    } finally {
      await client.close()
    }
  })

  it("registers every 1 through 3 stage tool for a fully scoped modern client", async () => {
    const runtime = createRuntime({
      configuration: {
        ...configuration,
        changes: {
          adminOrigin: "http://localhost:3001",
          approvalTtlMs: 5 * 60 * 1_000,
          executionLeaseMs: 30 * 1_000,
          requestStateSecret: "runtime-test-request-state-secret-with-32-bytes",
        },
      },
      scopes: [
        "admin:mcp:read",
        adminMcpDraftScope,
        adminMcpLifecycleScope,
        adminMcpPublishScope,
        adminMcpUserStatusScope,
        adminMcpUserDeleteScope,
      ],
    })
    const transport = createClientTransport(runtime, () => "all-tools-request")
    const client = new Client(
      { name: "admin-mcp-all-tools-client", version: "1.0.0" },
      { versionNegotiation: { mode: { pin: "2026-07-28" } } }
    )

    try {
      await client.connect(transport)
      const listed = await client.listTools()
      expect(listed.tools.map((tool) => tool.name)).toEqual([
        "admin_list_courses",
        "admin_get_course_editor",
        "admin_get_dashboard",
        "admin_get_analytics",
        "admin_list_lesson_analytics",
        "admin_list_audit_events",
        "admin_create_course_draft",
        "admin_save_course_draft",
        "admin_archive_course",
        "admin_restore_course",
        "admin_publish_course",
        "admin_set_user_status",
        "admin_delete_user",
      ])
    } finally {
      await client.close()
    }
  })

  it("deletes a user only after URL approval", async () => {
    const tools = createToolDependencies()
    const target = {
      expectedStatus: "active" as const,
      kind: "user-delete" as const,
      userId,
    }
    let persistedInputDigest = ""
    vi.mocked(tools.identity.learningQuery.readLearnerStatus).mockResolvedValue(
      ok("active")
    )
    vi.mocked(tools.identity.application.deleteUser).mockResolvedValue(
      ok({
        deletedAt: new Date("2026-08-10T00:00:03.000Z"),
        displayName: "삭제된 사용자",
        status: "deleted",
        userId,
      })
    )
    vi.mocked(tools.adminMcpApprovals.request).mockImplementation(
      async (input) => {
        persistedInputDigest = input.inputDigest
        return ok({
          approval: createApproval({
            idempotencyKey: input.idempotencyKey,
            inputDigest: input.inputDigest,
            status: "pending",
            target,
            toolName: "admin_delete_user",
          }),
          created: true,
        })
      }
    )
    vi.mocked(tools.adminMcpApprovals.claim).mockImplementation(async (input) =>
      ok({
        approval: createApproval({
          decidedAt: new Date("2026-08-10T00:00:01.000Z"),
          executionStartedAt: new Date("2026-08-10T00:00:02.000Z"),
          idempotencyKey: "delete-user-runtime-test",
          inputDigest: input.inputDigest,
          status: "executing",
          target,
          toolName: "admin_delete_user",
        }),
        outcome: "acquired",
      })
    )
    vi.mocked(tools.adminMcpApprovals.complete).mockImplementation(async () =>
      ok(
        createApproval({
          completedAt: new Date("2026-08-10T00:00:03.000Z"),
          decidedAt: new Date("2026-08-10T00:00:01.000Z"),
          executionStartedAt: new Date("2026-08-10T00:00:02.000Z"),
          idempotencyKey: "delete-user-runtime-test",
          inputDigest: persistedInputDigest,
          status: "succeeded",
          target,
          toolName: "admin_delete_user",
        })
      )
    )
    const runtime = createRuntime({
      configuration: {
        ...configuration,
        changes: {
          adminOrigin: "http://localhost:3001",
          approvalTtlMs: 5 * 60 * 1_000,
          executionLeaseMs: 30 * 1_000,
          requestStateSecret: "runtime-test-request-state-secret-with-32-bytes",
        },
      },
      scopes: ["admin:mcp:read", adminMcpUserDeleteScope],
      tools,
    })
    let requestSequence = 0
    const transport = createClientTransport(
      runtime,
      () => `delete-user-request-${++requestSequence}`
    )
    const client = new Client(
      { name: "admin-mcp-delete-user-client", version: "1.0.0" },
      {
        capabilities: { elicitation: { url: {} } },
        versionNegotiation: { mode: { pin: "2026-07-28" } },
      }
    )
    client.setRequestHandler("elicitation/create", async () => ({
      action: "accept",
    }))

    try {
      await client.connect(transport)
      const result = await client.callTool({
        arguments: {
          idempotencyKey: "delete-user-runtime-test",
          userId,
        },
        name: "admin_delete_user",
      })
      expect(result.isError).not.toBe(true)
      expect(result.structuredContent).toMatchObject({
        approvalId,
        deleted: true,
        executionId: approvalId,
        replayed: false,
        userId,
      })
    } finally {
      await client.close()
    }

    expect(tools.adminMcpApprovals.request).toHaveBeenCalledOnce()
    expect(tools.adminMcpApprovals.claim).toHaveBeenCalledOnce()
    expect(tools.identity.application.deleteUser).toHaveBeenCalledOnce()
    expect(tools.auditTrail.ensureMcpStarted).toHaveBeenCalledOnce()
    expect(tools.adminMcpApprovals.complete).toHaveBeenCalledOnce()
  })

  it("publishes a course only after URL approval", async () => {
    const tools = createToolDependencies()
    const target = {
      courseId,
      editVersion: 0,
      kind: "course-publish" as const,
      title: "발행 강의",
    }
    let persistedInputDigest = ""
    vi.mocked(tools.content.getCourseChangeTarget).mockResolvedValue({
      courseId,
      editVersion: 0,
      status: "active",
      title: "발행 강의",
    })
    vi.mocked(tools.adminMcpApprovals.request).mockImplementation(
      async (input) => {
        persistedInputDigest = input.inputDigest
        return ok({
          approval: createApproval({
            idempotencyKey: input.idempotencyKey,
            inputDigest: input.inputDigest,
            status: "pending",
            target,
            toolName: "admin_publish_course",
          }),
          created: true,
        })
      }
    )
    vi.mocked(tools.adminMcpApprovals.claim).mockImplementation(async (input) =>
      ok({
        approval: createApproval({
          decidedAt: new Date("2026-08-10T00:00:01.000Z"),
          executionStartedAt: new Date("2026-08-10T00:00:02.000Z"),
          idempotencyKey: "publish-course-runtime-test",
          inputDigest: input.inputDigest,
          status: "executing",
          target,
          toolName: "admin_publish_course",
        }),
        outcome: "acquired",
      })
    )
    vi.mocked(tools.content.executeApprovedMcpChange).mockImplementation(
      async (input) =>
        ok({
          receipt: {
            adminId,
            approvalId,
            courseId,
            createdAt: new Date("2026-08-10T00:00:03.000Z"),
            curriculumVersionId,
            executionId: input.executionId,
            inputDigest: input.inputDigest,
            mcpCredentialId: "approved-agent-client",
            publishedAt: new Date("2026-08-10T00:00:03.000Z"),
            resultKind: "course-published",
            revision: 1,
            toolName: "admin_publish_course",
          },
          replayed: false,
        })
    )
    vi.mocked(tools.adminMcpApprovals.complete).mockImplementation(async () =>
      ok(
        createApproval({
          completedAt: new Date("2026-08-10T00:00:03.000Z"),
          decidedAt: new Date("2026-08-10T00:00:01.000Z"),
          executionStartedAt: new Date("2026-08-10T00:00:02.000Z"),
          idempotencyKey: "publish-course-runtime-test",
          inputDigest: persistedInputDigest,
          status: "succeeded",
          target,
          toolName: "admin_publish_course",
        })
      )
    )
    const runtime = createRuntime({
      configuration: {
        ...configuration,
        changes: {
          adminOrigin: "http://localhost:3001",
          approvalTtlMs: 5 * 60 * 1_000,
          executionLeaseMs: 30 * 1_000,
          requestStateSecret: "runtime-test-request-state-secret-with-32-bytes",
        },
      },
      scopes: ["admin:mcp:read", adminMcpPublishScope],
      tools,
    })
    let requestSequence = 0
    const transport = createClientTransport(
      runtime,
      () => `publish-course-request-${++requestSequence}`
    )
    const client = new Client(
      { name: "admin-mcp-publish-course-client", version: "1.0.0" },
      {
        capabilities: { elicitation: { url: {} } },
        versionNegotiation: { mode: { pin: "2026-07-28" } },
      }
    )
    client.setRequestHandler("elicitation/create", async () => ({
      action: "accept",
    }))

    try {
      await client.connect(transport)
      const result = await client.callTool({
        arguments: {
          courseId,
          expectedEditVersion: 0,
          idempotencyKey: "publish-course-runtime-test",
        },
        name: "admin_publish_course",
      })
      expect(result.isError).not.toBe(true)
      expect(result.structuredContent).toMatchObject({
        approvalId,
        curriculumVersionId,
        executionId: approvalId,
        replayed: false,
        revision: 1,
      })
    } finally {
      await client.close()
    }

    expect(tools.adminMcpApprovals.request).toHaveBeenCalledOnce()
    expect(tools.content.executeApprovedMcpChange).toHaveBeenCalledOnce()
    expect(tools.auditTrail.ensureMcpStarted).toHaveBeenCalledOnce()
    expect(tools.adminMcpApprovals.complete).toHaveBeenCalledOnce()
  })

  it("rejects a legacy request with a missing token before an application call", async () => {
    const securityLogs: unknown[] = []
    const tools = createToolDependencies()
    const runtime = createRuntime({
      securityAuditLogger: (event) => securityLogs.push(event),
      tools,
    })
    const response = await runtime.fetch(createLegacyMcpRequest(), {
      requestId: "missing-token-request",
    })

    expect(response.status).toBe(401)
    expect(response.headers.get("www-authenticate")).toContain("Bearer")
    expect(response.headers.get("www-authenticate")).not.toContain(
      "resource_metadata="
    )
    expect(tools.content.getCourses).not.toHaveBeenCalled()
    expect(securityLogs).toContainEqual(
      expect.objectContaining({
        action: "authentication.failed",
        reasonCode: "invalid_token",
      })
    )
  })

  it("rejects a legacy request without the read scope before an application call", async () => {
    const tools = createToolDependencies()
    const runtime = createRuntime({ scopes: [], tools })
    const request = createLegacyMcpRequest({
      authorization: "Bearer valid-token",
    })
    const response = await runtime.fetch(request, {
      requestId: "missing-scope-request",
    })

    expect(response.status).toBe(403)
    expect(response.headers.get("www-authenticate") ?? "").not.toContain(
      "resource_metadata="
    )
    expect(tools.content.getCourses).not.toHaveBeenCalled()
  })

  it("does not expose OAuth metadata routes", async () => {
    const runtime = createRuntime()
    const fetch = vi.fn(runtime.fetch)
    const app = createUnifiedApp({
      adminApp: new Hono(),
      adminMcp: { runtime: { ...runtime, fetch } },
      learnerApp: new Hono(),
    })

    for (const path of [
      "/.well-known/oauth-protected-resource/mcp/admin",
      "/.well-known/oauth-authorization-server",
    ]) {
      const response = await app.fetch(
        new Request(`http://localhost:8787${path}`, {
          headers: { host: "localhost:8787" },
        })
      )
      expect(response.status).toBe(404)
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    ["host", { host: "attacker.example.com" }, "invalid_host"],
    [
      "origin",
      { host: "localhost:8787", origin: "https://attacker.example.com" },
      "invalid_origin",
    ],
    [
      "host before origin",
      {
        host: "attacker.example.com",
        origin: "https://attacker.example.com",
      },
      "invalid_host",
    ],
  ])(
    "rejects an unapproved %s before an application call",
    async (_name, headers, reasonCode) => {
      const requestLogs: unknown[] = []
      const securityLogs: unknown[] = []
      const tools = createToolDependencies()
      const runtime = createRuntime({
        requestLogger: (event) => requestLogs.push(event),
        securityAuditLogger: (event) => securityLogs.push(event),
        tools,
      })
      const requestId = `invalid-${_name}-request`
      const response = await runtime.fetch(
        createLegacyMcpRequest({
          authorization: "Bearer valid-token",
          ...headers,
        }),
        { requestId }
      )

      expect(response.status).toBe(403)
      await expect(response.clone().json()).resolves.toMatchObject({
        error: { code: -32_000 },
      })
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      expect(response.headers.get("vary")).toContain("Cookie")
      expect(response.headers.get("x-request-id")).toBe(requestId)
      expect(tools.content.getCourses).not.toHaveBeenCalled()
      expect(requestLogs).toEqual([
        expect.objectContaining({
          audience: "admin-mcp",
          errorClass: "client-error",
          outcome: "failed",
          requestId,
          status: 403,
        }),
      ])
      expect(securityLogs).toContainEqual(
        expect.objectContaining({ reasonCode })
      )
    }
  )

  it("returns a stable error when a course editor exceeds 256 KiB", async () => {
    const tools = createToolDependencies()
    vi.mocked(tools.content.getCourseEditor).mockResolvedValue({
      assets: [],
      category: "writing",
      courseId,
      coverAssetId: null,
      curriculumVersionId,
      description: "x".repeat(300_000),
      editVersion: 0,
      revision: 1,
      title: "large-course",
      units: [],
    })
    const runtime = createRuntime({ tools })
    let requestSequence = 0
    const transport = new StreamableHTTPClientTransport(new URL(resourceUrl), {
      authProvider: { token: async () => "valid-token" },
      fetch: async (input, init) => {
        const outgoing = new Request(input, init)
        const headers = new Headers(outgoing.headers)
        headers.set("host", "localhost:8787")
        return runtime.fetch(new Request(outgoing, { headers }), {
          requestId: `large-editor-request-${++requestSequence}`,
        })
      },
    })
    const client = new Client(
      { name: "admin-mcp-size-test-client", version: "1.0.0" },
      { versionNegotiation: { mode: { pin: "2026-07-28" } } }
    )

    try {
      await client.connect(transport)
      const result = await client.callTool({
        arguments: { courseId },
        name: "admin_get_course_editor",
      })
      expect(result.isError).toBe(true)
      expect(JSON.stringify(result.content)).toContain("RESPONSE_TOO_LARGE")
      expect(result.structuredContent).toBeUndefined()
    } finally {
      await client.close()
    }
  })
})

function createRuntime(
  override: Partial<RuntimeInput> &
    Readonly<{
      mcpCredentialId?: () => string
      scopes?: readonly string[]
      tools?: RuntimeInput["tools"]
    }> = {}
): AdminMcpRuntime {
  const scopes = [...(override.scopes ?? ["admin:mcp:read"])]
  const authentication: AdminMcpAuthentication = {
    verifier: {
      async verifyAccessToken(token) {
        return {
          clientId: override.mcpCredentialId?.() ?? "approved-agent-client",
          expiresAt: 4_102_444_800,
          extra: { adminId },
          resource: new URL(resourceUrl),
          scopes,
          token,
        }
      },
    },
  }
  const runtime = createAdminMcpRuntime({
    authentication,
    configuration: override.configuration ?? configuration,
    reportProtocolError: override.reportProtocolError,
    requestLogger: override.requestLogger ?? vi.fn(),
    securityAuditLogger: override.securityAuditLogger ?? vi.fn(),
    tools: override.tools ?? createToolDependencies(),
  })
  openRuntimes.push(runtime)
  return runtime
}

function createClientTransport(
  runtime: AdminMcpRuntime,
  nextRequestId: () => string,
  observeRequest?: (request: Request) => void | Promise<void>,
  observeResponse?: (response: Response) => void | Promise<void>
): StreamableHTTPClientTransport {
  return new StreamableHTTPClientTransport(new URL(resourceUrl), {
    authProvider: { token: async () => "valid-token" },
    fetch: async (input, init) => {
      const outgoing = new Request(input, init)
      await observeRequest?.(outgoing.clone())
      const headers = new Headers(outgoing.headers)
      headers.set("host", "localhost:8787")
      const response = await runtime.fetch(new Request(outgoing, { headers }), {
        requestId: nextRequestId(),
      })
      await observeResponse?.(response.clone())
      return response
    },
  })
}

function createUnifiedClientTransport(
  runtime: AdminMcpRuntime,
  nextRequestId: () => string,
  observers: Readonly<{
    observeRequest?: (request: Request) => void | Promise<void>
    observeResponse?: (response: Response) => void | Promise<void>
  }> = {}
): StreamableHTTPClientTransport {
  const app = createUnifiedApp({
    adminApp: new Hono(),
    adminMcp: { runtime },
    createRequestId: nextRequestId,
    learnerApp: new Hono(),
  })

  return new StreamableHTTPClientTransport(new URL(resourceUrl), {
    authProvider: { token: async () => "valid-token" },
    fetch: async (input, init) => {
      const outgoing = new Request(input, init)
      await observers.observeRequest?.(outgoing.clone())
      const headers = new Headers(outgoing.headers)
      headers.set("host", "localhost:8787")
      const response = await app.fetch(new Request(outgoing, { headers }))
      await observers.observeResponse?.(response.clone())
      return response
    },
  })
}

function createMaximumSizedCourseDraftDocument() {
  const baseDocument = {
    category: "미분류" as const,
    coverAssetId: null,
    curriculumVersionId,
    description: "",
    editVersion: 0,
    id: courseId,
    revision: 1,
    status: "active" as const,
    title: "자동 저장 코스",
    units: [],
  }
  const escapeUnit = '\\"\n'
  const emptyDocumentBytes = serializedByteLength(baseDocument)
  const escapeUnitBytes =
    serializedByteLength({ ...baseDocument, description: escapeUnit }) -
    emptyDocumentBytes
  const description = escapeUnit.repeat(
    Math.floor(
      (maximumCourseDraftDocumentBytes - emptyDocumentBytes) / escapeUnitBytes
    )
  )
  const remainingBytes =
    maximumCourseDraftDocumentBytes -
    serializedByteLength({ ...baseDocument, description })
  return {
    ...baseDocument,
    description: `${description}${"x".repeat(remainingBytes)}`,
  }
}

function serializedByteLength(value: unknown): number {
  const serialized = typeof value === "string" ? value : JSON.stringify(value)
  return new TextEncoder().encode(serialized).byteLength
}

function createApproval(
  override: Partial<AdminMcpApproval> &
    Pick<AdminMcpApproval, "inputDigest" | "status">
): AdminMcpApproval {
  return {
    completedAt: null,
    createdAt: new Date("2026-08-10T00:00:00.000Z"),
    decidedAt: null,
    executionStartedAt: null,
    expiresAt: new Date("2026-08-10T00:05:00.000Z"),
    failureCode: null,
    id: approvalId,
    idempotencyKey: "create-course-runtime-test",
    mcpCredentialId: "approved-agent-client",
    ownerAdminId: adminId,
    requestId: "mcp-change-request-1",
    target: {
      courseId,
      editVersion: 0,
      kind: "course-create",
      title: "새 강의",
    },
    toolName: "admin_create_course_draft",
    ...override,
  }
}

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
      readAnalytics: vi.fn(async () =>
        ok({
          dailySeries: [],
          from: "2026-07-12",
          matureCohortThrough: "2026-08-02",
          to: "2026-08-10",
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

function createLegacyMcpRequest(headers?: HeadersInit): Request {
  return new Request(resourceUrl, {
    body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
    headers: {
      "content-type": "application/json",
      host: "localhost:8787",
      ...Object.fromEntries(new Headers(headers)),
    },
    method: "POST",
  })
}

async function expectSuccessfulCall(
  client: Client,
  name: string,
  args: Record<string, unknown>
) {
  const result = await client.callTool({ arguments: args, name })
  expect(result.isError).not.toBe(true)
  expect(result.structuredContent).toBeDefined()
  return result
}

import {
  type CallToolResult,
  type InputRequiredResult,
  McpServer,
  type RequestStateCodec,
  type ServerContext,
} from "@modelcontextprotocol/server"
import {
  aiFeedbackQualityQuerySchema,
  aiFeedbackQualitySnapshotSchema,
} from "@workspace/contracts/ai-feedback/quality"
import {
  adminMcpArchiveCourseResultSchema,
  adminMcpCourseLifecycleInputSchema,
  adminMcpCreateCourseInputSchema,
  adminMcpCreateCourseResultSchema,
  adminMcpPublishCourseInputSchema,
  adminMcpPublishCourseResultSchema,
  adminMcpRestoreCourseResultSchema,
  adminMcpSaveCourseDraftInputSchema,
  adminMcpSaveCourseDraftResultSchema,
} from "@workspace/contracts/content/admin-mcp-changes"
import {
  adminCourseEditorDocumentSchema,
  adminCourseListDtoSchema,
} from "@workspace/contracts/content/admin-courses"
import {
  adminCourseParamsSchema,
  adminCoursesQuerySchema,
} from "@workspace/contracts/content/admin-routes"
import {
  adminIdSchema,
  type AdminId,
} from "@workspace/contracts/identity/admin-ids"
import {
  adminMcpDeleteUserInputSchema,
  adminMcpDeleteUserResultSchema,
  adminMcpSetUserStatusInputSchema,
  adminMcpSetUserStatusResultSchema,
} from "@workspace/contracts/identity/admin-mcp-changes"
import {
  adminAnalyticsDtoSchema,
  adminLessonAnalyticsPageDtoSchema,
} from "@workspace/contracts/operations/admin-analytics"
import {
  adminAuditEventsQuerySchema,
  adminMcpAuditEventsDtoSchema,
} from "@workspace/contracts/operations/admin-audit"
import { adminDashboardDtoSchema } from "@workspace/contracts/operations/admin-dashboard"
import {
  adminAnalyticsQuerySchema,
  adminLessonAnalyticsQuerySchema,
} from "@workspace/contracts/operations/analytics-query"
import {
  toAdminCourseEditorDocument,
  toAdminCourseList,
} from "@workspace/content/http"
import type { ContentModule } from "@workspace/content/module"
import type { IdentityModule } from "@workspace/identity/module"
import {
  toAdminAiFeedbackQualityDto,
  toAdminAnalyticsDto,
  toAdminDashboardDto,
  toAdminLessonAnalyticsPageDto,
  toAdminMcpAuditEventsDto,
} from "@workspace/operations/http"
import type { OperationsModule } from "@workspace/operations/module"
import { z } from "zod"

import { createAdminMcpSchema } from "@/mcp/admin/admin-mcp-schema"
import {
  createAdminMcpChanges,
  AdminMcpChangeError,
  type AdminMcpChangeRequestState,
} from "@/mcp/admin/admin-mcp-changes"
import {
  adminMcpDraftScope,
  adminMcpLifecycleScope,
  adminMcpPublishScope,
  adminMcpUserDeleteScope,
  adminMcpUserStatusScope,
  type AdminMcpChangeConfiguration,
} from "@/mcp/admin/admin-mcp-configuration"

const maximumCourseEditorResponseBytes = 256 * 1_024
const emptyInputSchema = createAdminMcpSchema(z.strictObject({}))
const listCoursesInputSchema = createAdminMcpSchema(
  adminCoursesQuerySchema.strict()
)
const listCoursesOutputSchema = createAdminMcpSchema(adminCourseListDtoSchema)
const courseEditorInputSchema = createAdminMcpSchema(
  adminCourseParamsSchema.strict()
)
const courseEditorOutputSchema = createAdminMcpSchema(
  adminCourseEditorDocumentSchema
)
const dashboardOutputSchema = createAdminMcpSchema(adminDashboardDtoSchema)
const analyticsInputSchema = createAdminMcpSchema(
  adminAnalyticsQuerySchema.strict()
)
const analyticsOutputSchema = createAdminMcpSchema(adminAnalyticsDtoSchema)
const lessonAnalyticsInputSchema = createAdminMcpSchema(
  adminLessonAnalyticsQuerySchema.strict()
)
const lessonAnalyticsOutputSchema = createAdminMcpSchema(
  adminLessonAnalyticsPageDtoSchema
)
const aiFeedbackQualityInputSchema = createAdminMcpSchema(
  aiFeedbackQualityQuerySchema
)
const aiFeedbackQualityOutputSchema = createAdminMcpSchema(
  aiFeedbackQualitySnapshotSchema
)
const auditEventsInputSchema = createAdminMcpSchema(
  adminAuditEventsQuerySchema.strict()
)
const auditEventsOutputSchema = createAdminMcpSchema(
  adminMcpAuditEventsDtoSchema
)
const createCourseInputSchema = createAdminMcpSchema(
  adminMcpCreateCourseInputSchema
)
const createCourseOutputSchema = createAdminMcpSchema(
  adminMcpCreateCourseResultSchema
)
const lifecycleCourseInputSchema = createAdminMcpSchema(
  adminMcpCourseLifecycleInputSchema
)
const archiveCourseOutputSchema = createAdminMcpSchema(
  adminMcpArchiveCourseResultSchema
)
const restoreCourseOutputSchema = createAdminMcpSchema(
  adminMcpRestoreCourseResultSchema
)
const saveCourseDraftInputSchema = createAdminMcpSchema(
  adminMcpSaveCourseDraftInputSchema
)
const saveCourseDraftOutputSchema = createAdminMcpSchema(
  adminMcpSaveCourseDraftResultSchema
)
const publishCourseInputSchema = createAdminMcpSchema(
  adminMcpPublishCourseInputSchema
)
const publishCourseOutputSchema = createAdminMcpSchema(
  adminMcpPublishCourseResultSchema
)
const setUserStatusInputSchema = createAdminMcpSchema(
  adminMcpSetUserStatusInputSchema
)
const setUserStatusOutputSchema = createAdminMcpSchema(
  adminMcpSetUserStatusResultSchema
)
const deleteUserInputSchema = createAdminMcpSchema(
  adminMcpDeleteUserInputSchema
)
const deleteUserOutputSchema = createAdminMcpSchema(
  adminMcpDeleteUserResultSchema
)
const requestIdSchema = z.string().min(1).max(200)
const toolAnnotations = {
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
  readOnlyHint: true,
} as const
const createToolAnnotations = {
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
  readOnlyHint: false,
} as const
const archiveToolAnnotations = {
  ...createToolAnnotations,
  destructiveHint: true,
} as const

type AdminMcpToolDependencies = Readonly<{
  adminMcpApprovals: OperationsModule["adminMcpApprovals"]
  auditTrail: OperationsModule["auditTrail"]
  content: Pick<
    ContentModule["application"],
    | "executeApprovedMcpChange"
    | "executeAutomaticMcpChange"
    | "getCourseChangeTarget"
    | "getCourseEditor"
    | "getCourses"
    | "readApprovedMcpChangeReceipt"
  >
  identity: Readonly<{
    application: Pick<
      IdentityModule["application"],
      "changeUserStatus" | "deleteUser"
    >
    learningQuery: IdentityModule["learningQuery"]
  }>
  now: () => Date
  reportUnexpectedError: (event: {
    readonly errorClass: "unexpected-tool-error"
    readonly requestId: string
    readonly toolName: AdminMcpToolName
  }) => void
  reporting: OperationsModule["reporting"]
}>

type AdminMcpToolName =
  | "admin_archive_course"
  | "admin_create_course_draft"
  | "admin_delete_user"
  | "admin_get_ai_feedback_quality"
  | "admin_get_analytics"
  | "admin_get_course_editor"
  | "admin_get_dashboard"
  | "admin_list_audit_events"
  | "admin_list_courses"
  | "admin_list_lesson_analytics"
  | "admin_publish_course"
  | "admin_restore_course"
  | "admin_save_course_draft"
  | "admin_set_user_status"

type AdminMcpRequestContext = Readonly<{
  adminId: AdminId
  context: ServerContext
  mcpCredentialId: string
  requestId: string
}>

type AdminMcpServerOptions = Readonly<{
  changeConfiguration: AdminMcpChangeConfiguration | undefined
  era: "legacy" | "modern"
  requestStateCodec: RequestStateCodec<AdminMcpChangeRequestState> | undefined
  scopes: readonly string[]
}>

export function createAdminMcpServer(
  dependencies: AdminMcpToolDependencies,
  options: AdminMcpServerOptions
): McpServer {
  const server = new McpServer(
    {
      name: "writing-app-admin",
      version: "1.0.0",
    },
    options.requestStateCodec === undefined
      ? undefined
      : { requestState: { verify: options.requestStateCodec.verify } }
  )

  server.registerTool(
    "admin_list_courses",
    {
      annotations: toolAnnotations,
      description:
        "List administrator-visible courses with bounded search, category, status, and pagination filters.",
      inputSchema: listCoursesInputSchema,
      outputSchema: listCoursesOutputSchema,
      title: "List admin courses",
    },
    (query, context) =>
      executeTool(dependencies, "admin_list_courses", context, async () => {
        const output = toAdminCourseList(
          await dependencies.content.getCourses(query)
        )
        return successResult(
          output,
          `코스 ${output.items.length}건을 조회했습니다.`
        )
      })
  )

  server.registerTool(
    "admin_get_course_editor",
    {
      annotations: toolAnnotations,
      description:
        "Read one administrator course editor document by validated course ID.",
      inputSchema: courseEditorInputSchema,
      outputSchema: courseEditorOutputSchema,
      title: "Get admin course editor",
    },
    ({ courseId }, context) =>
      executeTool(
        dependencies,
        "admin_get_course_editor",
        context,
        async () => {
          const document = await dependencies.content.getCourseEditor(courseId)
          if (document === null) {
            throw new AdminMcpToolError("COURSE_NOT_FOUND")
          }

          const output = toAdminCourseEditorDocument(document)
          if (serializedByteLength(output) > maximumCourseEditorResponseBytes) {
            throw new AdminMcpToolError("RESPONSE_TOO_LARGE")
          }
          return successResult(output, "코스 편집 문서를 조회했습니다.")
        }
      )
  )

  server.registerTool(
    "admin_get_dashboard",
    {
      annotations: toolAnnotations,
      description: "Read the administrator dashboard for the current date.",
      inputSchema: emptyInputSchema,
      outputSchema: dashboardOutputSchema,
      title: "Get admin dashboard",
    },
    (_input, context) =>
      executeTool(dependencies, "admin_get_dashboard", context, async () => {
        const result = await dependencies.reporting.readDashboard({
          now: dependencies.now(),
        })
        if (result.isErr()) {
          throw new AdminMcpToolError("REPORTING_UNAVAILABLE")
        }
        return successResult(
          toAdminDashboardDto(result.value),
          "관리자 대시보드를 조회했습니다."
        )
      })
  )

  server.registerTool(
    "admin_get_analytics",
    {
      annotations: toolAnnotations,
      description:
        "Read the administrator analytics summary for a bounded number of days.",
      inputSchema: analyticsInputSchema,
      outputSchema: analyticsOutputSchema,
      title: "Get admin analytics",
    },
    ({ days }, context) =>
      executeTool(dependencies, "admin_get_analytics", context, async () => {
        const result = await dependencies.reporting.readAnalytics({
          days,
          now: dependencies.now(),
        })
        if (result.isErr()) {
          throw new AdminMcpToolError("REPORTING_UNAVAILABLE")
        }
        return successResult(
          toAdminAnalyticsDto(result.value),
          "관리자 분석 요약을 조회했습니다."
        )
      })
  )

  server.registerTool(
    "admin_list_lesson_analytics",
    {
      annotations: toolAnnotations,
      description:
        "List lesson analytics with bounded search, sorting, and pagination.",
      inputSchema: lessonAnalyticsInputSchema,
      outputSchema: lessonAnalyticsOutputSchema,
      title: "List admin lesson analytics",
    },
    (query, context) =>
      executeTool(
        dependencies,
        "admin_list_lesson_analytics",
        context,
        async () => {
          const result = await dependencies.reporting.readLessonAnalytics(query)
          if (result.isErr()) {
            throw new AdminMcpToolError("REPORTING_UNAVAILABLE")
          }
          const output = toAdminLessonAnalyticsPageDto(result.value)
          return successResult(
            output,
            `레슨 분석 ${output.items.length}건을 조회했습니다.`
          )
        }
      )
  )

  server.registerTool(
    "admin_get_ai_feedback_quality",
    {
      annotations: toolAnnotations,
      description:
        "Read aggregate AI feedback quality without provider input or output text for a bounded half-open time range.",
      inputSchema: aiFeedbackQualityInputSchema,
      outputSchema: aiFeedbackQualityOutputSchema,
      title: "Get AI feedback quality",
    },
    ({ from, to }, context) =>
      executeTool(
        dependencies,
        "admin_get_ai_feedback_quality",
        context,
        async () => {
          const result = await dependencies.reporting.readAiFeedbackQuality({
            from: new Date(from),
            to: new Date(to),
          })
          if (result.isErr()) {
            throw new AdminMcpToolError("REPORTING_UNAVAILABLE")
          }
          return successResult(
            toAdminAiFeedbackQualityDto(result.value),
            "AI 코칭 품질 집계를 조회했습니다."
          )
        }
      )
  )

  server.registerTool(
    "admin_list_audit_events",
    {
      annotations: toolAnnotations,
      description:
        "List administrator audit events without client IP addresses using bounded date and pagination filters.",
      inputSchema: auditEventsInputSchema,
      outputSchema: auditEventsOutputSchema,
      title: "List admin audit events",
    },
    (query, context) =>
      executeTool(
        dependencies,
        "admin_list_audit_events",
        context,
        async ({ adminId }) => {
          const result = await dependencies.auditTrail.readEvents({
            actor: { id: adminId },
            category: query.category ?? null,
            from: query.from ?? null,
            page: query.page,
            pageSize: query.pageSize,
            to: query.to ?? null,
          })
          if (result.isErr()) {
            throw new AdminMcpToolError(
              result.error.kind === "invalid-audit-query"
                ? "AUDIT_QUERY_INVALID"
                : "AUDIT_READ_FAILED"
            )
          }
          const output = toAdminMcpAuditEventsDto(result.value)
          return successResult(
            output,
            `감사 이벤트 ${output.items.length}건을 조회했습니다.`
          )
        }
      )
  )

  if (
    options.era === "modern" &&
    options.changeConfiguration !== undefined &&
    options.requestStateCodec !== undefined
  ) {
    registerChangeTools(server, dependencies, {
      configuration: options.changeConfiguration,
      requestStateCodec: options.requestStateCodec,
      scopes: options.scopes,
    })
  }

  return server
}

function registerChangeTools(
  server: McpServer,
  dependencies: AdminMcpToolDependencies,
  options: Readonly<{
    configuration: AdminMcpChangeConfiguration
    requestStateCodec: RequestStateCodec<AdminMcpChangeRequestState>
    scopes: readonly string[]
  }>
): void {
  const changes = createAdminMcpChanges({
    approvals: dependencies.adminMcpApprovals,
    auditTrail: dependencies.auditTrail,
    configuration: options.configuration,
    content: dependencies.content,
    identity: dependencies.identity,
    now: dependencies.now,
    requestStateCodec: options.requestStateCodec,
  })

  if (options.scopes.includes(adminMcpDraftScope)) {
    server.registerTool(
      "admin_create_course_draft",
      {
        annotations: createToolAnnotations,
        description:
          "Create one empty course draft automatically with an idempotency receipt. Reuse the idempotency key when retrying the same request.",
        inputSchema: createCourseInputSchema,
        outputSchema: createCourseOutputSchema,
        title: "Create admin course draft",
      },
      (input, context) =>
        executeTool(
          dependencies,
          "admin_create_course_draft",
          context,
          (request) => {
            requireScope(request.context, adminMcpDraftScope)
            return changes.createCourseDraft(input, request)
          }
        )
    )

    server.registerTool(
      "admin_save_course_draft",
      {
        annotations: archiveToolAnnotations,
        description:
          "Save one complete course draft automatically after validating the edit version and preserving all existing image references. The document must be at most 256 KiB.",
        inputSchema: saveCourseDraftInputSchema,
        outputSchema: saveCourseDraftOutputSchema,
        title: "Save admin course draft",
      },
      (input, context) =>
        executeTool(
          dependencies,
          "admin_save_course_draft",
          context,
          (request) => {
            requireScope(request.context, adminMcpDraftScope)
            return changes.saveCourseDraft(input, request)
          }
        )
    )
  }

  if (options.scopes.includes(adminMcpLifecycleScope)) {
    server.registerTool(
      "admin_archive_course",
      {
        annotations: archiveToolAnnotations,
        description:
          "Archive one active course after the owner approves the persisted request. Reuse the idempotency key when retrying the same request.",
        inputSchema: lifecycleCourseInputSchema,
        outputSchema: archiveCourseOutputSchema,
        title: "Archive admin course",
      },
      (input, context) =>
        executeTool(
          dependencies,
          "admin_archive_course",
          context,
          (request) => {
            requireScope(request.context, adminMcpLifecycleScope)
            return changes.archiveCourse(input, request)
          }
        )
    )

    server.registerTool(
      "admin_restore_course",
      {
        annotations: createToolAnnotations,
        description:
          "Restore one archived course automatically with an idempotency receipt. Reuse the idempotency key when retrying the same request.",
        inputSchema: lifecycleCourseInputSchema,
        outputSchema: restoreCourseOutputSchema,
        title: "Restore admin course",
      },
      (input, context) =>
        executeTool(
          dependencies,
          "admin_restore_course",
          context,
          (request) => {
            requireScope(request.context, adminMcpLifecycleScope)
            return changes.restoreCourse(input, request)
          }
        )
    )
  }

  if (options.scopes.includes(adminMcpPublishScope)) {
    server.registerTool(
      "admin_publish_course",
      {
        annotations: archiveToolAnnotations,
        description:
          "Publish one validated course draft after the owner approves the persisted request. Reuse the idempotency key when retrying the same request.",
        inputSchema: publishCourseInputSchema,
        outputSchema: publishCourseOutputSchema,
        title: "Publish admin course",
      },
      (input, context) =>
        executeTool(
          dependencies,
          "admin_publish_course",
          context,
          (request) => {
            requireScope(request.context, adminMcpPublishScope)
            return changes.publishCourse(input, request)
          }
        )
    )
  }

  if (options.scopes.includes(adminMcpUserStatusScope)) {
    server.registerTool(
      "admin_set_user_status",
      {
        annotations: archiveToolAnnotations,
        description:
          "Activate or suspend one user after the owner approves the persisted request. Reuse the idempotency key when retrying the same request.",
        inputSchema: setUserStatusInputSchema,
        outputSchema: setUserStatusOutputSchema,
        title: "Set admin user status",
      },
      (input, context) =>
        executeTool(
          dependencies,
          "admin_set_user_status",
          context,
          (request) => {
            requireScope(request.context, adminMcpUserStatusScope)
            return changes.setUserStatus(input, request)
          }
        )
    )
  }

  if (options.scopes.includes(adminMcpUserDeleteScope)) {
    server.registerTool(
      "admin_delete_user",
      {
        annotations: archiveToolAnnotations,
        description:
          "Transition one user to deleted status after the owner approves the persisted request. Reuse the idempotency key when retrying the same request.",
        inputSchema: deleteUserInputSchema,
        outputSchema: deleteUserOutputSchema,
        title: "Delete admin user",
      },
      (input, context) =>
        executeTool(dependencies, "admin_delete_user", context, (request) => {
          requireScope(request.context, adminMcpUserDeleteScope)
          return changes.deleteUser(input, request)
        })
    )
  }
}

async function executeTool(
  dependencies: AdminMcpToolDependencies,
  toolName: AdminMcpToolName,
  context: ServerContext,
  operation: (
    request: AdminMcpRequestContext
  ) => Promise<CallToolResult | InputRequiredResult>
): Promise<CallToolResult | InputRequiredResult> {
  const requestId = readRequestId(context)
  try {
    return await operation({
      adminId: adminIdSchema.parse(context.http?.authInfo?.extra?.["adminId"]),
      context,
      mcpCredentialId: z
        .string()
        .min(1)
        .max(200)
        .parse(context.http?.authInfo?.clientId),
      requestId,
    })
  } catch (cause) {
    if (
      cause instanceof AdminMcpToolError ||
      cause instanceof AdminMcpChangeError
    ) {
      return errorResult(cause.code, requestId)
    }
    try {
      dependencies.reportUnexpectedError({
        errorClass: "unexpected-tool-error",
        requestId,
        toolName,
      })
    } catch {
      // 오류 보고 실패가 안정된 MCP 오류 결과를 바꾸면 안 된다.
    }
    return errorResult("INTERNAL_ERROR", requestId)
  }
}

function requireScope(context: ServerContext, scope: string): void {
  if (context.http?.authInfo?.scopes.includes(scope)) return
  throw new AdminMcpToolError("INSUFFICIENT_SCOPE")
}

function readRequestId(context: ServerContext): string {
  const result = requestIdSchema.safeParse(
    context.http?.authInfo?.extra?.["requestId"]
  )
  return result.success ? result.data : "unavailable"
}

function successResult(
  structuredContent: Record<string, unknown>,
  summary: string
): CallToolResult {
  return {
    content: [{ text: summary, type: "text" }],
    structuredContent,
  }
}

function errorResult(code: string, requestId: string): CallToolResult {
  return {
    content: [
      {
        text: `요청을 처리하지 못했습니다. code=${code} requestId=${requestId}`,
        type: "text",
      },
    ],
    isError: true,
  }
}

function serializedByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}

class AdminMcpToolError extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}

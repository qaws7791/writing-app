import { createHash } from "node:crypto"

import {
  inputRequired,
  type CallToolResult,
  type InputRequiredResult,
  type RequestStateCodec,
  type ServerContext,
} from "@modelcontextprotocol/server"
import type {
  AdminMcpCreateCourseInput,
  AdminMcpCourseLifecycleInput,
  AdminMcpPublishCourseInput,
  AdminMcpSaveCourseDraftInput,
} from "@workspace/contracts/content/admin-mcp-changes"
import { courseIdSchema } from "@workspace/contracts/content/ids"
import type {
  AdminMcpDeleteUserInput,
  AdminMcpSetUserStatusInput,
} from "@workspace/contracts/identity/admin-mcp-changes"
import {
  adminMcpApprovalIdSchema,
  adminMcpChangeToolNameSchema,
  type AdminMcpChangeToolName,
} from "@workspace/contracts/operations/admin-mcp-approvals"
import { adminMcpExecutionIdSchema } from "@workspace/contracts/operations/admin-mcp-executions"
import {
  toAdminCourseEditorDocument,
  toCourseEditorDocument,
} from "@workspace/content/http"
import type { ContentModule } from "@workspace/content/module"
import type { AdminMcpContentChangeReceipt } from "@workspace/content/ports"
import type { IdentityModule } from "@workspace/identity/module"
import type { OperationsModule } from "@workspace/operations/module"
import type { AdminMcpApproval } from "@workspace/operations/ports"
import type {
  AdminId,
  AdminMcpApprovalId,
  AdminMcpExecutionId,
  CourseId,
} from "@workspace/types/ids"
import { z } from "zod"

import type { AdminMcpChangeConfiguration } from "@/mcp/admin/admin-mcp-configuration"

const maximumCourseDraftRequestBytes = 256 * 1_024
const requestStateSchema = z
  .object({
    approvalId: adminMcpApprovalIdSchema,
    inputDigest: z.string().regex(/^[a-f0-9]{64}$/u),
    toolName: adminMcpChangeToolNameSchema,
  })
  .strict()

export type AdminMcpChangeRequestState = z.infer<typeof requestStateSchema>

type AdminMcpChangeDependencies = Readonly<{
  approvals: OperationsModule["adminMcpApprovals"]
  auditTrail: OperationsModule["auditTrail"]
  configuration: AdminMcpChangeConfiguration
  content: Pick<
    ContentModule["application"],
    | "executeApprovedMcpChange"
    | "executeAutomaticMcpChange"
    | "getCourseChangeTarget"
    | "getCourseEditor"
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
  requestStateCodec: RequestStateCodec<AdminMcpChangeRequestState>
}>

type AdminMcpAuthenticatedRequest = Readonly<{
  adminId: AdminId
  context: ServerContext
  mcpCredentialId: string
  requestId: string
}>

type AutomaticContentCommand = Parameters<
  ContentModule["application"]["executeAutomaticMcpChange"]
>[0]

type ApprovedContentCommand = Parameters<
  ContentModule["application"]["executeApprovedMcpChange"]
>[0]

export type AdminMcpChanges = Readonly<{
  archiveCourse: (
    input: AdminMcpCourseLifecycleInput,
    request: AdminMcpAuthenticatedRequest
  ) => Promise<CallToolResult | InputRequiredResult>
  createCourseDraft: (
    input: AdminMcpCreateCourseInput,
    request: AdminMcpAuthenticatedRequest
  ) => Promise<CallToolResult>
  deleteUser: (
    input: AdminMcpDeleteUserInput,
    request: AdminMcpAuthenticatedRequest
  ) => Promise<CallToolResult | InputRequiredResult>
  publishCourse: (
    input: AdminMcpPublishCourseInput,
    request: AdminMcpAuthenticatedRequest
  ) => Promise<CallToolResult | InputRequiredResult>
  restoreCourse: (
    input: AdminMcpCourseLifecycleInput,
    request: AdminMcpAuthenticatedRequest
  ) => Promise<CallToolResult>
  saveCourseDraft: (
    input: AdminMcpSaveCourseDraftInput,
    request: AdminMcpAuthenticatedRequest
  ) => Promise<CallToolResult>
  setUserStatus: (
    input: AdminMcpSetUserStatusInput,
    request: AdminMcpAuthenticatedRequest
  ) => Promise<CallToolResult | InputRequiredResult>
}>

export function createAdminMcpChanges(
  dependencies: AdminMcpChangeDependencies
): AdminMcpChanges {
  return {
    archiveCourse: (input, request) =>
      requestCourseApproval(
        dependencies,
        input,
        request,
        "admin_archive_course"
      ),
    createCourseDraft: (input, request) =>
      runAutomaticCourseCreate(dependencies, input, request),
    deleteUser: (input, request) =>
      requestUserApproval(dependencies, input, request, "admin_delete_user"),
    publishCourse: (input, request) =>
      requestCourseApproval(
        dependencies,
        input,
        request,
        "admin_publish_course"
      ),
    restoreCourse: (input, request) =>
      runAutomaticCourseRestore(dependencies, input, request),
    saveCourseDraft: (input, request) =>
      runAutomaticCourseSave(dependencies, input, request),
    setUserStatus: (input, request) =>
      requestUserApproval(
        dependencies,
        input,
        request,
        "admin_set_user_status"
      ),
  }
}

async function runAutomaticCourseCreate(
  dependencies: AdminMcpChangeDependencies,
  input: AdminMcpCreateCourseInput,
  request: AdminMcpAuthenticatedRequest
): Promise<CallToolResult> {
  const toolName = "admin_create_course_draft" as const
  const binding = automaticBinding(input, request, toolName)
  const courseId = automaticCourseId(binding.executionId)
  const execution = await executeAutomaticContentChange(
    dependencies,
    {
      ...binding,
      courseId,
      kind: "create-course",
    },
    "course.create",
    request,
    courseId
  )
  const course = await dependencies.content.getCourseEditor(
    execution.receipt.courseId
  )
  if (course === null)
    throw new AdminMcpChangeError("CHANGE_RECEIPT_UNAVAILABLE")
  return successResult("강의 초안을 생성했습니다.", {
    course: toAdminCourseEditorDocument(course),
    executionId: binding.executionId,
    replayed: execution.replayed,
  })
}

async function runAutomaticCourseSave(
  dependencies: AdminMcpChangeDependencies,
  input: AdminMcpSaveCourseDraftInput,
  request: AdminMcpAuthenticatedRequest
): Promise<CallToolResult> {
  if (serializedByteLength(input.document) > maximumCourseDraftRequestBytes) {
    throw new AdminMcpChangeError("REQUEST_TOO_LARGE")
  }
  const document = toCourseEditorDocument(input.document)
  if (document.isErr()) throw new AdminMcpChangeError("COURSE_INPUT_INVALID")

  const toolName = "admin_save_course_draft" as const
  const binding = automaticBinding(input, request, toolName)
  const execution = await executeAutomaticContentChange(
    dependencies,
    {
      ...binding,
      document: document.value,
      expectedEditVersion: input.expectedEditVersion,
      kind: "save-course-draft",
    },
    "course.draft.save",
    request,
    input.document.id
  )
  const course = await dependencies.content.getCourseEditor(
    execution.receipt.courseId
  )
  if (course === null)
    throw new AdminMcpChangeError("CHANGE_RECEIPT_UNAVAILABLE")
  return successResult("강의 초안을 저장했습니다.", {
    course: toAdminCourseEditorDocument(course),
    executionId: binding.executionId,
    replayed: execution.replayed,
  })
}

async function runAutomaticCourseRestore(
  dependencies: AdminMcpChangeDependencies,
  input: AdminMcpCourseLifecycleInput,
  request: AdminMcpAuthenticatedRequest
): Promise<CallToolResult> {
  const target = await dependencies.content.getCourseChangeTarget(
    input.courseId
  )
  if (target === null) throw new AdminMcpChangeError("COURSE_NOT_FOUND")

  const toolName = "admin_restore_course" as const
  const binding = automaticBinding(input, request, toolName)
  const execution = await executeAutomaticContentChange(
    dependencies,
    {
      ...binding,
      courseId: input.courseId,
      expectedEditVersion: target.editVersion,
      expectedStatus: "archived",
      kind: "restore-course",
    },
    "course.restore",
    request,
    input.courseId
  )
  return successResult("강의 보관을 해제했습니다.", {
    courseId: execution.receipt.courseId,
    executionId: binding.executionId,
    replayed: execution.replayed,
    restored: true,
  })
}

function automaticBinding(
  input: Readonly<{ idempotencyKey: string }>,
  request: AdminMcpAuthenticatedRequest,
  toolName:
    | "admin_create_course_draft"
    | "admin_restore_course"
    | "admin_save_course_draft"
) {
  const inputDigest = digestInput({ ...input, toolName })
  const executionId = adminMcpExecutionIdSchema.parse(
    `admin-mcp-execution-${createHash("sha256")
      .update(
        canonicalJson({
          adminId: request.adminId,
          idempotencyKey: input.idempotencyKey,
          mcpCredentialId: request.mcpCredentialId,
          toolName,
        })
      )
      .digest("hex")
      .slice(0, 32)}`
  )
  return {
    adminId: request.adminId,
    executionId,
    idempotencyKey: input.idempotencyKey,
    inputDigest,
    mcpCredentialId: request.mcpCredentialId,
    toolName,
  }
}

async function executeAutomaticContentChange(
  dependencies: AdminMcpChangeDependencies,
  command: AutomaticContentCommand,
  action: Parameters<OperationsModule["auditTrail"]["beginMcp"]>[0]["action"],
  request: AdminMcpAuthenticatedRequest,
  courseId: CourseId
) {
  const audit = await dependencies.auditTrail.beginMcp({
    action,
    actorId: request.adminId,
    approvalId: null,
    executionId: command.executionId,
    inputDigest: command.inputDigest,
    mcpCredentialId: request.mcpCredentialId,
    requestId: request.requestId,
    target: { id: courseId, type: "course" },
  })
  if (audit.isErr()) throw new AdminMcpChangeError("AUDIT_UNAVAILABLE")

  const execution =
    await dependencies.content.executeAutomaticMcpChange(command)
  if (execution.isErr()) {
    await completeAuditOrThrow(dependencies, audit.value.id, "failed")
    throw new AdminMcpChangeError(contentFailureCode(execution.error.kind))
  }
  await completeAuditOrThrow(dependencies, audit.value.id, "succeeded")
  return execution.value
}

async function requestCourseApproval(
  dependencies: AdminMcpChangeDependencies,
  input: AdminMcpCourseLifecycleInput | AdminMcpPublishCourseInput,
  request: AdminMcpAuthenticatedRequest,
  toolName: "admin_archive_course" | "admin_publish_course"
): Promise<CallToolResult | InputRequiredResult> {
  const inputDigest = digestInput({ ...input, toolName })
  const state = readRequestState(request.context, toolName, inputDigest)
  if (state !== null) return executeApprovedChange(dependencies, state, request)

  const target = await dependencies.content.getCourseChangeTarget(
    input.courseId
  )
  if (target === null) throw new AdminMcpChangeError("COURSE_NOT_FOUND")
  if (target.status !== "active") {
    throw new AdminMcpChangeError("COURSE_STATE_CONFLICT")
  }
  if (
    toolName === "admin_publish_course" &&
    ("expectedEditVersion" in input
      ? input.expectedEditVersion !== target.editVersion
      : true)
  ) {
    throw new AdminMcpChangeError("COURSE_STATE_CONFLICT")
  }

  const requested = await dependencies.approvals.request({
    expiresAt: approvalExpiresAt(dependencies),
    idempotencyKey: input.idempotencyKey,
    inputDigest,
    mcpCredentialId: request.mcpCredentialId,
    ownerAdminId: request.adminId,
    requestId: request.requestId,
    target:
      toolName === "admin_publish_course"
        ? {
            courseId: target.courseId,
            editVersion: target.editVersion,
            kind: "course-publish" as const,
            title: target.title,
          }
        : {
            courseId: target.courseId,
            editVersion: target.editVersion,
            expectedStatus: "active" as const,
            kind: "course-lifecycle" as const,
            title: target.title,
          },
    toolName,
  })
  if (requested.isErr()) throw approvalError(requested.error.kind)
  return requestApprovalInput(
    dependencies,
    requested.value.approval.id,
    inputDigest,
    toolName,
    request.context
  )
}

async function requestUserApproval(
  dependencies: AdminMcpChangeDependencies,
  input: AdminMcpDeleteUserInput | AdminMcpSetUserStatusInput,
  request: AdminMcpAuthenticatedRequest,
  toolName: "admin_delete_user" | "admin_set_user_status"
): Promise<CallToolResult | InputRequiredResult> {
  const inputDigest = digestInput({ ...input, toolName })
  const state = readRequestState(request.context, toolName, inputDigest)
  if (state !== null) return executeApprovedChange(dependencies, state, request)

  const current = await dependencies.identity.learningQuery.readLearnerStatus(
    input.userId
  )
  if (current.isErr()) throw new AdminMcpChangeError("USER_NOT_FOUND")
  if (current.value === "deleted") {
    throw new AdminMcpChangeError("USER_STATE_CONFLICT")
  }
  if (
    toolName === "admin_set_user_status" &&
    ("status" in input ? input.status === current.value : true)
  ) {
    throw new AdminMcpChangeError("USER_STATE_CONFLICT")
  }

  const requested = await dependencies.approvals.request({
    expiresAt: approvalExpiresAt(dependencies),
    idempotencyKey: input.idempotencyKey,
    inputDigest,
    mcpCredentialId: request.mcpCredentialId,
    ownerAdminId: request.adminId,
    requestId: request.requestId,
    target:
      toolName === "admin_set_user_status" && "status" in input
        ? {
            expectedStatus: current.value,
            kind: "user-status" as const,
            targetStatus: input.status,
            userId: input.userId,
          }
        : {
            expectedStatus: current.value,
            kind: "user-delete" as const,
            userId: input.userId,
          },
    toolName,
  })
  if (requested.isErr()) throw approvalError(requested.error.kind)
  return requestApprovalInput(
    dependencies,
    requested.value.approval.id,
    inputDigest,
    toolName,
    request.context
  )
}

function readRequestState(
  context: ServerContext,
  toolName: AdminMcpChangeToolName,
  inputDigest: string
): AdminMcpChangeRequestState | null {
  const rawState = context.mcpReq.requestState<unknown>()
  if (rawState === undefined) return null
  const state = requestStateSchema.safeParse(rawState)
  if (
    !state.success ||
    state.data.toolName !== toolName ||
    state.data.inputDigest !== inputDigest
  ) {
    throw new AdminMcpChangeError("REQUEST_STATE_INVALID")
  }
  return state.data
}

async function requestApprovalInput(
  dependencies: AdminMcpChangeDependencies,
  approvalId: AdminMcpApprovalId,
  inputDigest: string,
  toolName: AdminMcpChangeToolName,
  context: ServerContext
): Promise<InputRequiredResult> {
  const approvalUrl = new URL(
    `/mcp-approvals/${encodeURIComponent(approvalId)}`,
    dependencies.configuration.adminOrigin
  )
  return inputRequired({
    inputRequests: {
      approval: inputRequired.elicitUrl({
        message: "관리자 페이지에서 변경 요청을 검토하고 승인해 주세요.",
        url: approvalUrl.href,
      }),
    },
    requestState: await dependencies.requestStateCodec.mint(
      { approvalId, inputDigest, toolName },
      context
    ),
  })
}

async function executeApprovedChange(
  dependencies: AdminMcpChangeDependencies,
  state: AdminMcpChangeRequestState,
  request: AdminMcpAuthenticatedRequest
): Promise<CallToolResult | InputRequiredResult> {
  const claimed = await dependencies.approvals.claim({
    approvalId: state.approvalId,
    executionLeaseMs: dependencies.configuration.executionLeaseMs,
    inputDigest: state.inputDigest,
    mcpCredentialId: request.mcpCredentialId,
    ownerAdminId: request.adminId,
    toolName: state.toolName,
  })
  if (claimed.isErr()) throw approvalError(claimed.error.kind)
  const { approval, outcome } = claimed.value

  if (outcome === "awaiting-approval") {
    return requestApprovalInput(
      dependencies,
      approval.id,
      approval.inputDigest,
      approval.toolName,
      request.context
    )
  }
  if (outcome === "in-progress") {
    throw new AdminMcpChangeError("CHANGE_IN_PROGRESS")
  }
  if (outcome === "completed") {
    if (approval.status === "failed") {
      throw new AdminMcpChangeError(approval.failureCode ?? "CHANGE_FAILED")
    }
    return readCompletedResult(dependencies, approval, request)
  }

  const descriptor = approvedAuditDescriptor(approval)
  const executionId = approvalExecutionId(approval.id)
  const audit = await dependencies.auditTrail.ensureMcpStarted({
    action: descriptor.action,
    actorId: request.adminId,
    approvalId: approval.id,
    createdAt: approval.createdAt,
    eventId: auditEventId(approval.id),
    executionId,
    inputDigest: approval.inputDigest,
    mcpCredentialId: approval.mcpCredentialId,
    requestId: approval.requestId,
    target: descriptor.target,
  })
  if (audit.isErr()) throw new AdminMcpChangeError("AUDIT_UNAVAILABLE")

  const execution = await executeApprovedMutation(
    dependencies,
    approval,
    request.adminId,
    executionId
  )
  if (execution.status === "error") {
    await completeAuditOrThrow(dependencies, audit.value.id, "failed")
    await completeApprovalOrThrow(
      dependencies,
      approval.id,
      execution.code,
      "failed"
    )
    throw new AdminMcpChangeError(execution.code)
  }

  await completeAuditOrThrow(dependencies, audit.value.id, "succeeded")
  await completeApprovalOrThrow(dependencies, approval.id, null, "succeeded")
  return execution.result
}

async function executeApprovedMutation(
  dependencies: AdminMcpChangeDependencies,
  approval: AdminMcpApproval,
  adminId: AdminId,
  executionId: AdminMcpExecutionId
): Promise<
  | Readonly<{ code: string; status: "error" }>
  | Readonly<{ result: CallToolResult; status: "ok" }>
> {
  if (
    approval.toolName === "admin_set_user_status" ||
    approval.toolName === "admin_delete_user"
  ) {
    return executeApprovedIdentityMutation(
      dependencies,
      approval,
      adminId,
      executionId
    )
  }

  const command = approvedContentCommand(approval, adminId, executionId)
  const execution = await dependencies.content.executeApprovedMcpChange(command)
  return execution.isErr()
    ? { code: contentFailureCode(execution.error.kind), status: "error" }
    : {
        result: await contentResult(
          dependencies,
          execution.value.receipt,
          execution.value.replayed
        ),
        status: "ok",
      }
}

async function executeApprovedIdentityMutation(
  dependencies: AdminMcpChangeDependencies,
  approval: AdminMcpApproval,
  adminId: AdminId,
  executionId: AdminMcpExecutionId
): Promise<
  | Readonly<{ code: string; status: "error" }>
  | Readonly<{ result: CallToolResult; status: "ok" }>
> {
  const target = approval.target
  if (target.kind !== "user-status" && target.kind !== "user-delete") {
    throw new AdminMcpChangeError("APPROVAL_INVALID")
  }
  const current = await dependencies.identity.learningQuery.readLearnerStatus(
    target.userId
  )
  if (current.isErr()) return { code: "USER_NOT_FOUND", status: "error" }
  const desiredStatus =
    target.kind === "user-status" ? target.targetStatus : "deleted"
  let replayed = current.value === desiredStatus
  if (!replayed) {
    if (current.value !== target.expectedStatus) {
      return { code: "USER_STATE_CONFLICT", status: "error" }
    }
    const changed =
      target.kind === "user-status"
        ? await dependencies.identity.application.changeUserStatus({
            actor: { id: adminId },
            status: target.targetStatus,
            userId: target.userId,
          })
        : await dependencies.identity.application.deleteUser({
            actor: { id: adminId },
            userId: target.userId,
          })
    if (changed.isErr()) {
      return { code: identityFailureCode(changed.error.kind), status: "error" }
    }
    replayed = false
  }

  return {
    result: identityResult(approval, executionId, replayed),
    status: "ok",
  }
}

async function readCompletedResult(
  dependencies: AdminMcpChangeDependencies,
  approval: AdminMcpApproval,
  request: AdminMcpAuthenticatedRequest
): Promise<CallToolResult> {
  const executionId = approvalExecutionId(approval.id)
  if (
    approval.toolName === "admin_set_user_status" ||
    approval.toolName === "admin_delete_user"
  ) {
    return identityResult(approval, executionId, true)
  }

  const receipt = await dependencies.content.readApprovedMcpChangeReceipt({
    adminId: request.adminId,
    approvalId: approval.id,
    executionId,
    inputDigest: approval.inputDigest,
    mcpCredentialId: request.mcpCredentialId,
    toolName: approval.toolName,
  })
  if (receipt.isErr() || receipt.value === null) {
    throw new AdminMcpChangeError("CHANGE_RECEIPT_UNAVAILABLE")
  }
  return contentResult(dependencies, receipt.value, true)
}

function approvedContentCommand(
  approval: AdminMcpApproval,
  adminId: AdminId,
  executionId: AdminMcpExecutionId
): ApprovedContentCommand {
  const binding = {
    adminId,
    approvalId: approval.id,
    executionId,
    inputDigest: approval.inputDigest,
    mcpCredentialId: approval.mcpCredentialId,
  }
  switch (approval.toolName) {
    case "admin_create_course_draft":
      if (approval.target.kind !== "course-create") break
      return {
        ...binding,
        courseId: approval.target.courseId,
        kind: "create-course",
        toolName: "admin_create_course_draft",
      }
    case "admin_archive_course":
      if (approval.target.kind !== "course-lifecycle") break
      return {
        ...binding,
        courseId: approval.target.courseId,
        expectedEditVersion: approval.target.editVersion,
        expectedStatus: "active",
        kind: "archive-course",
        toolName: "admin_archive_course",
      }
    case "admin_restore_course":
      if (approval.target.kind !== "course-lifecycle") break
      return {
        ...binding,
        courseId: approval.target.courseId,
        expectedEditVersion: approval.target.editVersion,
        expectedStatus: "archived",
        kind: "restore-course",
        toolName: "admin_restore_course",
      }
    case "admin_publish_course":
      if (approval.target.kind !== "course-publish") break
      return {
        ...binding,
        courseId: approval.target.courseId,
        expectedEditVersion: approval.target.editVersion,
        kind: "publish-course",
        toolName: "admin_publish_course",
      }
  }
  throw new AdminMcpChangeError("APPROVAL_INVALID")
}

async function contentResult(
  dependencies: AdminMcpChangeDependencies,
  receipt: AdminMcpContentChangeReceipt,
  replayed: boolean
): Promise<CallToolResult> {
  if (receipt.resultKind === "course-created") {
    const course = await dependencies.content.getCourseEditor(receipt.courseId)
    if (course === null) {
      throw new AdminMcpChangeError("CHANGE_RECEIPT_UNAVAILABLE")
    }
    return successResult("강의 초안을 생성했습니다.", {
      approvalId: receipt.approvalId,
      course: toAdminCourseEditorDocument(course),
      executionId: receipt.executionId,
      replayed,
    })
  }
  if (receipt.resultKind === "course-published") {
    return successResult("강의를 발행했습니다.", {
      approvalId: receipt.approvalId,
      curriculumVersionId: receipt.curriculumVersionId,
      executionId: receipt.executionId,
      publishedAt: receipt.publishedAt.toISOString(),
      replayed,
      revision: receipt.revision,
    })
  }
  if (receipt.resultKind === "course-archived") {
    return successResult("강의를 보관했습니다.", {
      approvalId: receipt.approvalId,
      archived: true,
      courseId: receipt.courseId,
      executionId: receipt.executionId,
      replayed,
    })
  }
  return successResult("강의 보관을 해제했습니다.", {
    approvalId: receipt.approvalId,
    courseId: receipt.courseId,
    executionId: receipt.executionId,
    replayed,
    restored: true,
  })
}

function identityResult(
  approval: AdminMcpApproval,
  executionId: AdminMcpExecutionId,
  replayed: boolean
): CallToolResult {
  if (
    approval.toolName === "admin_set_user_status" &&
    approval.target.kind === "user-status"
  ) {
    return successResult("사용자 상태를 변경했습니다.", {
      approvalId: approval.id,
      executionId,
      replayed,
      status: approval.target.targetStatus,
      userId: approval.target.userId,
    })
  }
  if (
    approval.toolName === "admin_delete_user" &&
    approval.target.kind === "user-delete"
  ) {
    return successResult("사용자 삭제 상태 전환을 완료했습니다.", {
      approvalId: approval.id,
      deleted: true,
      executionId,
      replayed,
      userId: approval.target.userId,
    })
  }
  throw new AdminMcpChangeError("APPROVAL_INVALID")
}

function approvedAuditDescriptor(approval: AdminMcpApproval) {
  switch (approval.toolName) {
    case "admin_create_course_draft":
      if (approval.target.kind === "course-create") {
        return {
          action: "course.create" as const,
          target: { id: approval.target.courseId, type: "course" as const },
        }
      }
      break
    case "admin_archive_course":
      if (approval.target.kind === "course-lifecycle") {
        return {
          action: "course.archive" as const,
          target: { id: approval.target.courseId, type: "course" as const },
        }
      }
      break
    case "admin_restore_course":
      if (approval.target.kind === "course-lifecycle") {
        return {
          action: "course.restore" as const,
          target: { id: approval.target.courseId, type: "course" as const },
        }
      }
      break
    case "admin_publish_course":
      if (approval.target.kind === "course-publish") {
        return {
          action: "course.publish" as const,
          target: { id: approval.target.courseId, type: "course" as const },
        }
      }
      break
    case "admin_set_user_status":
      if (approval.target.kind === "user-status") {
        return {
          action:
            approval.target.targetStatus === "active"
              ? ("learner.status.activate" as const)
              : ("learner.status.suspend" as const),
          target: { id: approval.target.userId, type: "learner" as const },
        }
      }
      break
    case "admin_delete_user":
      if (approval.target.kind === "user-delete") {
        return {
          action: "learner.delete" as const,
          target: { id: approval.target.userId, type: "learner" as const },
        }
      }
      break
  }
  throw new AdminMcpChangeError("APPROVAL_INVALID")
}

function approvalExpiresAt(dependencies: AdminMcpChangeDependencies): Date {
  return new Date(
    dependencies.now().getTime() + dependencies.configuration.approvalTtlMs
  )
}

function approvalExecutionId(
  approvalId: AdminMcpApprovalId
): AdminMcpExecutionId {
  return adminMcpExecutionIdSchema.parse(approvalId)
}

function automaticCourseId(executionId: AdminMcpExecutionId): CourseId {
  return courseIdSchema.parse(
    `course-mcp-${createHash("sha256")
      .update(executionId)
      .digest("hex")
      .slice(0, 32)}`
  )
}

function auditEventId(approvalId: AdminMcpApprovalId) {
  return `mcp-audit:${createHash("sha256")
    .update(approvalId)
    .digest("hex")
    .slice(0, 32)}`
}

async function completeAuditOrThrow(
  dependencies: AdminMcpChangeDependencies,
  eventId: Parameters<OperationsModule["auditTrail"]["complete"]>[0]["eventId"],
  outcome: "failed" | "succeeded"
): Promise<void> {
  const completion = await dependencies.auditTrail.complete({
    eventId,
    outcome,
  })
  if (completion.isErr()) throw new AdminMcpChangeError("AUDIT_UNAVAILABLE")
}

async function completeApprovalOrThrow(
  dependencies: AdminMcpChangeDependencies,
  approvalId: AdminMcpApprovalId,
  failureCode: string | null,
  outcome: "failed" | "succeeded"
): Promise<void> {
  const completion = await dependencies.approvals.complete({
    approvalId,
    failureCode,
    outcome,
  })
  if (completion.isErr()) throw new AdminMcpChangeError("APPROVAL_UNAVAILABLE")
}

function digestInput(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex")
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`
  }
  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right, "en"))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`
}

function serializedByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}

function successResult(
  summary: string,
  structuredContent: Record<string, unknown>
): CallToolResult {
  return {
    content: [{ text: summary, type: "text" }],
    structuredContent,
  }
}

function contentFailureCode(kind: string): string {
  switch (kind) {
    case "content-not-found":
      return "COURSE_NOT_FOUND"
    case "content-conflict":
      return "COURSE_STATE_CONFLICT"
    case "content-idempotency-conflict":
      return "IDEMPOTENCY_CONFLICT"
    case "content-validation-failed":
      return "COURSE_INPUT_INVALID"
    default:
      return "CONTENT_CHANGE_FAILED"
  }
}

function identityFailureCode(kind: string): string {
  switch (kind) {
    case "identity-not-found":
      return "USER_NOT_FOUND"
    case "identity-conflict":
    case "identity-deleted":
    case "identity-invalid-status-transition":
      return "USER_STATE_CONFLICT"
    case "identity-deletion-marker-failed":
      return "DELETION_MARKER_UNAVAILABLE"
    case "identity-session-revocation-failed":
      return "SESSION_REVOCATION_FAILED"
    default:
      return "IDENTITY_CHANGE_FAILED"
  }
}

function approvalError(kind: string): AdminMcpChangeError {
  const codes: Record<string, string> = {
    "admin-mcp-approval-binding-mismatch": "APPROVAL_BINDING_MISMATCH",
    "admin-mcp-approval-conflict": "IDEMPOTENCY_CONFLICT",
    "admin-mcp-approval-expired": "APPROVAL_EXPIRED",
    "admin-mcp-approval-invalid": "APPROVAL_INVALID",
    "admin-mcp-approval-not-found": "APPROVAL_NOT_FOUND",
    "admin-mcp-approval-not-pending": "APPROVAL_REJECTED",
    "admin-mcp-approval-persistence-failed": "APPROVAL_UNAVAILABLE",
  }
  return new AdminMcpChangeError(codes[kind] ?? "APPROVAL_UNAVAILABLE")
}

export class AdminMcpChangeError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = "AdminMcpChangeError"
  }
}

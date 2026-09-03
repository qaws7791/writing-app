import { and, eq } from "drizzle-orm"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  AdminId,
  AdminMcpApprovalId,
  AdminMcpExecutionId,
} from "@workspace/types/ids"

import type { ContentError } from "#content/domain/content-error"
import {
  hasAdminMcpAutomaticContentChangeBinding,
  hasAdminMcpContentChangeBinding,
  type AdminMcpAutomaticContentChangeBinding,
  type AdminMcpAutomaticContentChangeCommand,
  type AdminMcpAutomaticContentChangeReceipt,
  type AdminMcpContentChangeBinding,
  type AdminMcpContentChangeCommand,
  type AdminMcpContentChangeReceipt,
} from "#content/domain/admin-mcp-content-change"
import {
  createCourseId,
  readCurriculumVersionId,
} from "#content/domain/content-model"
import { insertCourse } from "#content/infrastructure/persistence/content-course-drizzle"
import {
  DraftSaveAbort,
  publishDraftInTransaction,
  saveDraftInTransaction,
} from "#content/infrastructure/persistence/content-draft-publish-drizzle"
import {
  isUniqueConstraintViolation,
  type CourseReadDatabase,
  type WritingAppDatabaseTransaction,
} from "#content/infrastructure/persistence/content-drizzle-shared"
import {
  contentMcpAutomaticChangeReceipts,
  contentMcpChangeReceipts,
  courseCurriculumVersions,
  courses,
} from "#content/infrastructure/persistence/schema"

export function executeApprovedMcpChange(
  database: WritingAppDatabase,
  input: AdminMcpContentChangeCommand & Readonly<{ now: Date }>
) {
  try {
    return database.transaction((transaction) => {
      const existing = readReceiptRow(transaction, input.approvalId)
      if (existing !== null) {
        return hasAdminMcpContentChangeBinding(existing, input)
          ? ok({ receipt: existing, replayed: true })
          : err({ kind: "content-idempotency-conflict" } as const)
      }

      const result = executeApprovedMcpMutation(transaction, input)
      if (result === null) {
        return err({ kind: "content-idempotency-conflict" } as const)
      }

      const receipt: AdminMcpContentChangeReceipt = {
        adminId: input.adminId,
        approvalId: input.approvalId,
        courseId: input.courseId,
        createdAt: new Date(input.now),
        executionId: input.executionId,
        inputDigest: input.inputDigest,
        mcpCredentialId: input.mcpCredentialId,
        ...result,
        toolName: input.toolName,
      }
      transaction
        .insert(contentMcpChangeReceipts)
        .values(toReceiptRow(receipt))
        .run()
      return ok({ receipt, replayed: false })
    })
  } catch (cause) {
    if (cause instanceof McpContentChangeError) {
      return err(cause.contentError)
    }
    if (isUniqueConstraintViolation(cause)) {
      const receipt = readReceiptRow(database, input.approvalId)
      return receipt !== null && hasAdminMcpContentChangeBinding(receipt, input)
        ? ok({ receipt, replayed: true })
        : err({ cause, kind: "content-idempotency-conflict" } as const)
    }
    throw cause
  }
}

function executeApprovedMcpMutation(
  transaction: WritingAppDatabaseTransaction,
  input: AdminMcpContentChangeCommand & Readonly<{ now: Date }>
) {
  if (input.kind === "create-course") {
    if (input.toolName !== "admin_create_course_draft") return null
    insertCourse(transaction, { courseId: input.courseId, now: input.now })
    return { resultKind: "course-created" as const }
  }

  if (input.kind === "publish-course") {
    if (input.toolName !== "admin_publish_course") return null
    const published = publishDraftInTransaction(transaction, input)
    if (published.isErr()) throw new McpContentChangeError(published.error)
    return {
      curriculumVersionId: published.value.curriculumVersionId,
      publishedAt: published.value.publishedAt,
      resultKind: "course-published" as const,
      revision: published.value.revision,
    }
  }

  const expectedToolName =
    input.kind === "archive-course"
      ? "admin_archive_course"
      : "admin_restore_course"
  if (input.toolName !== expectedToolName) return null

  executeLifecycleMcpMutation(transaction, input)
  return {
    resultKind:
      input.kind === "archive-course"
        ? ("course-archived" as const)
        : ("course-restored" as const),
  }
}

export function executeAutomaticMcpChange(
  database: WritingAppDatabase,
  input: AdminMcpAutomaticContentChangeCommand & Readonly<{ now: Date }>
) {
  try {
    return database.transaction((transaction) => {
      const existing = readAutomaticReceiptRow(transaction, input.executionId)
      if (existing !== null) {
        return hasAdminMcpAutomaticContentChangeBinding(existing, input)
          ? ok({ receipt: existing, replayed: true })
          : err({ kind: "content-idempotency-conflict" } as const)
      }

      const result = executeAutomaticMcpMutation(transaction, input)
      if (result === null) {
        return err({ kind: "content-idempotency-conflict" } as const)
      }
      const courseId =
        input.kind === "save-course-draft"
          ? input.draft.courseId
          : input.courseId
      const receipt: AdminMcpAutomaticContentChangeReceipt = {
        adminId: input.adminId,
        courseId,
        createdAt: new Date(input.now),
        executionId: input.executionId,
        idempotencyKey: input.idempotencyKey,
        inputDigest: input.inputDigest,
        mcpCredentialId: input.mcpCredentialId,
        resultKind: result,
        toolName: input.toolName,
      }
      transaction
        .insert(contentMcpAutomaticChangeReceipts)
        .values(toAutomaticReceiptRow(receipt))
        .run()
      return ok({ receipt, replayed: false })
    })
  } catch (cause) {
    if (
      cause instanceof McpContentChangeError ||
      cause instanceof DraftSaveAbort
    ) {
      return err(cause.contentError)
    }
    if (isUniqueConstraintViolation(cause)) {
      const receipt = readAutomaticReceiptRow(database, input.executionId)
      return receipt !== null &&
        hasAdminMcpAutomaticContentChangeBinding(receipt, input)
        ? ok({ receipt, replayed: true })
        : err({ cause, kind: "content-idempotency-conflict" } as const)
    }
    throw cause
  }
}

function executeAutomaticMcpMutation(
  transaction: WritingAppDatabaseTransaction,
  input: AdminMcpAutomaticContentChangeCommand & Readonly<{ now: Date }>
): AdminMcpAutomaticContentChangeReceipt["resultKind"] | null {
  if (input.kind === "create-course") {
    if (input.toolName !== "admin_create_course_draft") return null
    insertCourse(transaction, { courseId: input.courseId, now: input.now })
    return "course-created"
  }
  if (input.kind === "save-course-draft") {
    if (input.toolName !== "admin_save_course_draft") return null
    const saved = saveDraftInTransaction(transaction, {
      ...input,
      preserveAssetReferences: true,
    })
    if (saved.isErr()) throw new McpContentChangeError(saved.error)
    return "course-draft-saved"
  }
  if (input.toolName !== "admin_restore_course") return null
  executeLifecycleMcpMutation(transaction, input)
  return "course-restored"
}

function executeLifecycleMcpMutation(
  transaction: WritingAppDatabaseTransaction,
  input:
    | Extract<AdminMcpContentChangeCommand, { kind: "archive-course" }>
    | Extract<AdminMcpContentChangeCommand, { kind: "restore-course" }>
    | Extract<AdminMcpAutomaticContentChangeCommand, { kind: "restore-course" }>
): void {
  const targetStatus = input.kind === "archive-course" ? "archived" : "active"
  const current = transaction
    .select({
      editVersion: courseCurriculumVersions.editVersion,
      status: courses.status,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      and(
        eq(courseCurriculumVersions.courseId, courses.id),
        eq(courseCurriculumVersions.status, "draft")
      )
    )
    .where(eq(courses.id, input.courseId))
    .get()
  if (current === undefined) {
    throw new McpContentChangeError({ kind: "content-not-found" })
  }
  if (
    current.status !== input.expectedStatus ||
    current.editVersion !== input.expectedEditVersion
  ) {
    throw new McpContentChangeError({ kind: "content-conflict" })
  }
  const updated = transaction
    .update(courses)
    .set({ status: targetStatus })
    .where(
      and(
        eq(courses.id, input.courseId),
        eq(courses.status, input.expectedStatus)
      )
    )
    .returning({ id: courses.id })
    .get()
  if (updated === undefined) {
    throw new McpContentChangeError({ kind: "content-conflict" })
  }
}

export function readApprovedMcpChangeReceipt(
  database: CourseReadDatabase,
  binding: AdminMcpContentChangeBinding
): Result<AdminMcpContentChangeReceipt | null, ContentError> {
  const receipt = readReceiptRow(database, binding.approvalId)
  if (receipt === null) return ok(null)
  return hasAdminMcpContentChangeBinding(receipt, binding)
    ? ok(receipt)
    : err({ kind: "content-idempotency-conflict" })
}

function readReceiptRow(
  database: CourseReadDatabase,
  approvalId: AdminMcpApprovalId
): AdminMcpContentChangeReceipt | null {
  const row = database
    .select()
    .from(contentMcpChangeReceipts)
    .where(eq(contentMcpChangeReceipts.approvalId, approvalId))
    .get()
  if (row === undefined) return null
  const binding = {
    adminId: row.actorId as AdminId,
    approvalId: row.approvalId as AdminMcpApprovalId,
    courseId: createCourseId(row.targetCourseId),
    createdAt: new Date(row.createdAt),
    executionId: row.executionId as AdminMcpExecutionId,
    inputDigest: row.inputDigest,
    mcpCredentialId: row.mcpCredentialId,
    toolName: row.toolName,
  }
  if (row.resultKind !== "course-published") {
    return { ...binding, resultKind: row.resultKind }
  }
  if (
    row.resultCurriculumVersionId === null ||
    row.resultPublishedAt === null ||
    row.resultRevision === null
  ) {
    throw new Error(`Invalid MCP publish receipt: ${row.approvalId}`)
  }
  return {
    ...binding,
    curriculumVersionId: readCurriculumVersionId(row.resultCurriculumVersionId),
    publishedAt: new Date(row.resultPublishedAt),
    resultKind: "course-published",
    revision: row.resultRevision,
  }
}

function toReceiptRow(receipt: AdminMcpContentChangeReceipt) {
  return {
    actorId: receipt.adminId,
    approvalId: receipt.approvalId,
    createdAt: receipt.createdAt,
    executionId: receipt.executionId,
    inputDigest: receipt.inputDigest,
    mcpCredentialId: receipt.mcpCredentialId,
    resultKind: receipt.resultKind,
    resultCurriculumVersionId:
      receipt.resultKind === "course-published"
        ? receipt.curriculumVersionId
        : null,
    resultPublishedAt:
      receipt.resultKind === "course-published" ? receipt.publishedAt : null,
    resultRevision:
      receipt.resultKind === "course-published" ? receipt.revision : null,
    targetCourseId: receipt.courseId,
    toolName: receipt.toolName,
  }
}

export function readAutomaticMcpChangeReceipt(
  database: CourseReadDatabase,
  binding: AdminMcpAutomaticContentChangeBinding
): Result<AdminMcpAutomaticContentChangeReceipt | null, ContentError> {
  const receipt = readAutomaticReceiptRow(database, binding.executionId)
  if (receipt === null) return ok(null)
  return hasAdminMcpAutomaticContentChangeBinding(receipt, binding)
    ? ok(receipt)
    : err({ kind: "content-idempotency-conflict" })
}

function readAutomaticReceiptRow(
  database: CourseReadDatabase,
  executionId: AdminMcpExecutionId
): AdminMcpAutomaticContentChangeReceipt | null {
  const row = database
    .select()
    .from(contentMcpAutomaticChangeReceipts)
    .where(eq(contentMcpAutomaticChangeReceipts.executionId, executionId))
    .get()
  return row === undefined
    ? null
    : {
        adminId: row.actorId as AdminId,
        courseId: createCourseId(row.targetCourseId),
        createdAt: new Date(row.createdAt),
        executionId: row.executionId as AdminMcpExecutionId,
        idempotencyKey: row.idempotencyKey,
        inputDigest: row.inputDigest,
        mcpCredentialId: row.mcpCredentialId,
        resultKind: row.resultKind,
        toolName: row.toolName,
      }
}

function toAutomaticReceiptRow(receipt: AdminMcpAutomaticContentChangeReceipt) {
  return {
    actorId: receipt.adminId,
    createdAt: receipt.createdAt,
    executionId: receipt.executionId,
    idempotencyKey: receipt.idempotencyKey,
    inputDigest: receipt.inputDigest,
    mcpCredentialId: receipt.mcpCredentialId,
    resultKind: receipt.resultKind,
    targetCourseId: receipt.courseId,
    toolName: receipt.toolName,
  }
}

class McpContentChangeError extends Error {
  constructor(readonly contentError: ContentError) {
    super(contentError.kind)
    this.name = "McpContentChangeError"
  }
}

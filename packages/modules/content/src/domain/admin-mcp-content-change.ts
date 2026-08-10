import type { AdminMcpChangeToolName } from "@workspace/contracts/operations/admin-mcp-approvals"
import type {
  AdminId,
  AdminMcpApprovalId,
  AdminMcpExecutionId,
  CourseId,
  CurriculumVersionId,
} from "@workspace/types/ids"

import type {
  CurriculumDraft,
  PublishedCurriculumRevision,
} from "#content/domain/content-model"

export const adminMcpContentChangeResultKindValues = [
  "course-created",
  "course-published",
  "course-archived",
  "course-restored",
] as const

export const adminMcpAutomaticContentChangeResultKindValues = [
  "course-created",
  "course-draft-saved",
  "course-restored",
] as const

export const adminMcpAutomaticContentToolNameValues = [
  "admin_create_course_draft",
  "admin_save_course_draft",
  "admin_restore_course",
] as const

type AdminMcpApprovedContentToolName = Extract<
  AdminMcpChangeToolName,
  | "admin_archive_course"
  | "admin_create_course_draft"
  | "admin_publish_course"
  | "admin_restore_course"
>

type AdminMcpAutomaticContentToolName =
  (typeof adminMcpAutomaticContentToolNameValues)[number]

export type AdminMcpContentChangeBinding = Readonly<{
  adminId: AdminId
  approvalId: AdminMcpApprovalId
  executionId: AdminMcpExecutionId
  inputDigest: string
  oauthClientId: string
  toolName: AdminMcpApprovedContentToolName
}>

export type AdminMcpAutomaticContentChangeBinding = Readonly<{
  adminId: AdminId
  executionId: AdminMcpExecutionId
  idempotencyKey: string
  inputDigest: string
  oauthClientId: string
  toolName: AdminMcpAutomaticContentToolName
}>

export type AdminMcpContentChangeCommand = AdminMcpContentChangeBinding &
  (
    | Readonly<{
        courseId: CourseId
        kind: "create-course"
      }>
    | Readonly<{
        courseId: CourseId
        expectedEditVersion: number
        expectedStatus: "active"
        kind: "archive-course"
      }>
    | Readonly<{
        courseId: CourseId
        expectedEditVersion: number
        kind: "publish-course"
        nextDraftId: CurriculumVersionId
        publishedRevision: PublishedCurriculumRevision
      }>
    | Readonly<{
        courseId: CourseId
        expectedEditVersion: number
        expectedStatus: "archived"
        kind: "restore-course"
      }>
  )

export type AdminMcpAutomaticContentChangeCommand =
  AdminMcpAutomaticContentChangeBinding &
    (
      | Readonly<{
          courseId: CourseId
          kind: "create-course"
        }>
      | Readonly<{
          draft: CurriculumDraft
          expectedEditVersion: number
          kind: "save-course-draft"
        }>
      | Readonly<{
          courseId: CourseId
          expectedEditVersion: number
          expectedStatus: "archived"
          kind: "restore-course"
        }>
    )

type AdminMcpContentChangeReceiptResult =
  | Readonly<{
      resultKind: "course-created" | "course-archived" | "course-restored"
    }>
  | Readonly<{
      curriculumVersionId: CurriculumVersionId
      publishedAt: Date
      resultKind: "course-published"
      revision: number
    }>

export type AdminMcpContentChangeReceipt = AdminMcpContentChangeBinding &
  Readonly<{
    courseId: CourseId
    createdAt: Date
  }> &
  AdminMcpContentChangeReceiptResult

export type AdminMcpAutomaticContentChangeReceipt =
  AdminMcpAutomaticContentChangeBinding &
    Readonly<{
      courseId: CourseId
      createdAt: Date
      resultKind: "course-created" | "course-draft-saved" | "course-restored"
    }>

export type AdminMcpContentChangeExecution = Readonly<{
  receipt: AdminMcpContentChangeReceipt
  replayed: boolean
}>

export type AdminMcpAutomaticContentChangeExecution = Readonly<{
  receipt: AdminMcpAutomaticContentChangeReceipt
  replayed: boolean
}>

export function hasAdminMcpContentChangeBinding(
  receipt: AdminMcpContentChangeReceipt,
  binding: AdminMcpContentChangeBinding
): boolean {
  return (
    receipt.adminId === binding.adminId &&
    receipt.approvalId === binding.approvalId &&
    receipt.executionId === binding.executionId &&
    receipt.inputDigest === binding.inputDigest &&
    receipt.oauthClientId === binding.oauthClientId &&
    receipt.toolName === binding.toolName
  )
}

export function hasAdminMcpAutomaticContentChangeBinding(
  receipt: AdminMcpAutomaticContentChangeReceipt,
  binding: AdminMcpAutomaticContentChangeBinding
): boolean {
  return (
    receipt.adminId === binding.adminId &&
    receipt.executionId === binding.executionId &&
    receipt.idempotencyKey === binding.idempotencyKey &&
    receipt.inputDigest === binding.inputDigest &&
    receipt.oauthClientId === binding.oauthClientId &&
    receipt.toolName === binding.toolName
  )
}

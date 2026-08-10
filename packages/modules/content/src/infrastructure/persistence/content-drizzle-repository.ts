import {
  and,
  asc,
  count,
  eq,
  inArray,
  isNotNull,
  like,
  lte,
  sql,
} from "drizzle-orm"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  AdminId,
  AdminMcpApprovalId,
  AdminMcpExecutionId,
  CourseId,
  ContentAssetId,
  CurriculumVersionId,
  LessonId,
} from "@workspace/types/ids"

import type { ContentError } from "#content/domain/content-error"
import {
  contentAssetOrphanRetentionMs,
  type ContentAsset,
  type ContentAssetKind,
} from "#content/domain/content-asset"
import {
  contentStatuses,
  createCourseId,
  createCurriculumVersionId,
  readCourseVisualKey,
  readCurriculumVersionId,
  readLessonId,
  readLessonStepId,
  readLessonStepType,
  readUnitId,
  type Course,
  type CurriculumDraft,
  type CurriculumLesson,
  type CurriculumStep,
  type CurriculumUnit,
  type PublishedCourseSummary,
  type PublishedCurriculumRevision,
  type PublishedLessonReference,
} from "#content/domain/content-model"
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
import { createCurriculumDraft } from "#content/domain/curriculum"
import type {
  ContentCourseRowPage,
  ContentAssetOwner,
  ContentRepository,
  CourseChangeTarget,
  CourseEditorDocument,
  ReadContentCoursesInput,
} from "#content/application/ports/content-ports"
import {
  contentAssets,
  contentMcpAutomaticChangeReceipts,
  contentMcpChangeReceipts,
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "#content/infrastructure/persistence/schema"

const activeStatus = contentStatuses.active

type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]
type CourseReadDatabase = Pick<WritingAppDatabase, "select">

export function createDrizzleContentRepository(
  database: WritingAppDatabase
): ContentRepository {
  return {
    async createAsset(asset) {
      return createAsset(database, asset)
    },
    async createCourse(input) {
      return createCourse(database, input)
    },
    async executeApprovedMcpChange(input) {
      return executeApprovedMcpChange(database, input)
    },
    async executeAutomaticMcpChange(input) {
      return executeAutomaticMcpChange(database, input)
    },
    async findCourse(courseId) {
      return findCourse(database, courseId)
    },
    async findCurriculumByLesson(input) {
      return findCurriculumByLesson(database, input)
    },
    async findDraft(courseId) {
      return readDraft(database, courseId)
    },
    async listPublishedCourseSummaries() {
      return listPublishedCourseSummaries(database)
    },
    async listActiveAssetsForCourse(courseId) {
      return listActiveAssetsForCourse(database, courseId)
    },
    async listAssetsForCourse(courseId) {
      return listAssetsForCourse(database, courseId)
    },
    async listOrphanedAssetCandidates(input) {
      return listOrphanedAssetCandidates(database, input)
    },
    async deleteOrphanedAssetCandidates(input) {
      return deleteOrphanedAssetCandidates(database, input)
    },
    async readAssetOwner(input) {
      return readAssetOwner(database, input)
    },
    async readActiveAssetsByIds(assetIds) {
      return readActiveAssetsByIds(database, assetIds)
    },
    async publishDraft(input) {
      return publishDraft(database, input)
    },
    async readCourseEditor(courseId) {
      const draft = readDraft(database, courseId)
      if (draft.isErr()) {
        throw new Error(`Content draft invariant failed: ${draft.error.kind}`)
      }
      return draft.value === null ? null : toCourseEditorDocument(draft.value)
    },
    async readCourseChangeTarget(courseId) {
      return readCourseChangeTarget(database, courseId)
    },
    async readCourses(input) {
      return readCourses(database, input)
    },
    async readCurriculum(input) {
      return readCurriculum(database, input)
    },
    async readApprovedMcpChangeReceipt(binding) {
      return readApprovedMcpChangeReceipt(database, binding)
    },
    async readAutomaticMcpChangeReceipt(binding) {
      return readAutomaticMcpChangeReceipt(database, binding)
    },
    async saveCourse(input) {
      return saveCourse(database, input)
    },
    async saveDraft(input) {
      return saveDraft(database, input)
    },
  }
}

function listActiveAssetsForCourse(
  database: CourseReadDatabase,
  courseId: CourseId
): readonly ContentAsset[] {
  return database
    .select()
    .from(contentAssets)
    .where(
      and(
        eq(contentAssets.courseId, courseId),
        eq(contentAssets.status, "active")
      )
    )
    .orderBy(asc(contentAssets.createdAt), asc(contentAssets.id))
    .all()
    .map(toContentAsset)
}

function listAssetsForCourse(
  database: CourseReadDatabase,
  courseId: CourseId
): readonly ContentAsset[] {
  return database
    .select()
    .from(contentAssets)
    .where(eq(contentAssets.courseId, courseId))
    .orderBy(asc(contentAssets.createdAt), asc(contentAssets.id))
    .all()
    .map(toContentAsset)
}

function readActiveAssetsByIds(
  database: CourseReadDatabase,
  assetIds: readonly ContentAssetId[]
): readonly ContentAsset[] {
  if (assetIds.length === 0) return []

  return database
    .select()
    .from(contentAssets)
    .where(
      and(
        inArray(contentAssets.id, assetIds),
        eq(contentAssets.status, "active")
      )
    )
    .orderBy(asc(contentAssets.id))
    .all()
    .map(toContentAsset)
}

function listOrphanedAssetCandidates(
  database: WritingAppDatabase,
  input: { readonly batchSize: number; readonly cutoff: Date }
) {
  try {
    return ok(
      database
        .select({
          id: contentAssets.id,
          objectKey: contentAssets.objectKey,
        })
        .from(contentAssets)
        .innerJoin(
          courseCurriculumVersions,
          eq(courseCurriculumVersions.id, contentAssets.curriculumVersionId)
        )
        .where(
          and(
            eq(contentAssets.status, "orphaned"),
            isNotNull(contentAssets.orphanedAt),
            lte(contentAssets.orphanedAt, input.cutoff),
            eq(courseCurriculumVersions.status, "draft")
          )
        )
        .orderBy(asc(contentAssets.orphanedAt), asc(contentAssets.id))
        .limit(input.batchSize)
        .all()
        .map(({ id, objectKey }) => ({ id: id as ContentAssetId, objectKey }))
    )
  } catch (cause) {
    return err({ cause, kind: "content-asset-persistence-failed" } as const)
  }
}

function deleteOrphanedAssetCandidates(
  database: WritingAppDatabase,
  input: {
    readonly assetIds: readonly ContentAssetId[]
    readonly cutoff: Date
  }
) {
  if (input.assetIds.length === 0) return ok(0)

  try {
    const deleted = database
      .delete(contentAssets)
      .where(
        and(
          inArray(contentAssets.id, input.assetIds),
          eq(contentAssets.status, "orphaned"),
          isNotNull(contentAssets.orphanedAt),
          lte(contentAssets.orphanedAt, input.cutoff)
        )
      )
      .returning({ id: contentAssets.id })
      .all()
    return ok(deleted.length)
  } catch (cause) {
    return err({ cause, kind: "content-asset-persistence-failed" } as const)
  }
}

function readAssetOwner(
  database: CourseReadDatabase,
  input: {
    readonly courseId: CourseId
    readonly curriculumVersionId: CurriculumVersionId
  }
): ContentAssetOwner | null {
  const owner = database
    .select({
      courseId: courseCurriculumVersions.courseId,
      curriculumVersionId: courseCurriculumVersions.id,
      versionStatus: courseCurriculumVersions.status,
    })
    .from(courseCurriculumVersions)
    .innerJoin(courses, eq(courses.id, courseCurriculumVersions.courseId))
    .where(
      and(
        eq(courses.id, input.courseId),
        eq(courses.status, activeStatus),
        eq(courseCurriculumVersions.id, input.curriculumVersionId)
      )
    )
    .get()

  return owner === undefined
    ? null
    : {
        courseId: createCourseId(owner.courseId),
        curriculumVersionId: readCurriculumVersionId(owner.curriculumVersionId),
        versionStatus: owner.versionStatus,
      }
}

function createAsset(
  database: WritingAppDatabase,
  asset: ContentAsset
): Result<ContentAsset, ContentError> {
  try {
    return database.transaction((transaction) => {
      const owner = transaction
        .select({
          courseStatus: courses.status,
          versionStatus: courseCurriculumVersions.status,
        })
        .from(courseCurriculumVersions)
        .innerJoin(courses, eq(courses.id, courseCurriculumVersions.courseId))
        .where(
          and(
            eq(courses.id, asset.courseId),
            eq(courseCurriculumVersions.id, asset.curriculumVersionId)
          )
        )
        .get()

      if (owner === undefined || owner.courseStatus !== activeStatus) {
        return err({ kind: "content-not-found" })
      }
      if (owner.versionStatus !== "draft") {
        return err({ kind: "content-immutable-revision" })
      }

      transaction.insert(contentAssets).values(asset).run()
      return ok(asset)
    })
  } catch (cause) {
    if (isUniqueConstraintViolation(cause)) {
      return err({ cause, kind: "content-conflict" })
    }
    throw cause
  }
}

function createCourse(
  database: WritingAppDatabase,
  input: { readonly courseId: CourseId; readonly now: Date }
): Result<CourseEditorDocument, ContentError> {
  try {
    return ok(
      database.transaction((transaction) => insertCourse(transaction, input))
    )
  } catch (cause) {
    if (isUniqueConstraintViolation(cause)) {
      return err({ cause, kind: "content-conflict" })
    }
    throw cause
  }
}

function insertCourse(
  transaction: WritingAppDatabaseTransaction,
  input: { readonly courseId: CourseId; readonly now: Date }
): CourseEditorDocument {
  const curriculumVersionId = createCurriculumVersionId(input.courseId, 1)
  const sortOrder = readNextCourseSortOrder(transaction)

  transaction
    .insert(courses)
    .values({
      createdAt: input.now,
      id: input.courseId,
      publishedCurriculumVersionId: null,
      sortOrder,
      status: activeStatus,
    })
    .run()
  transaction
    .insert(courseCurriculumVersions)
    .values({
      category: "미분류",
      courseId: input.courseId,
      coverAssetId: null,
      createdAt: input.now,
      description: "강의 설명을 입력하세요.",
      editVersion: 0,
      id: curriculumVersionId,
      publishedAt: null,
      revision: 1,
      status: "draft",
      title: "새 강의",
      updatedAt: input.now,
      visualKey: "basic-sentence-writing",
    })
    .run()

  return {
    assets: [],
    category: "미분류",
    courseId: input.courseId,
    coverAssetId: null,
    curriculumVersionId,
    description: "강의 설명을 입력하세요.",
    editVersion: 0,
    revision: 1,
    title: "새 강의",
    units: [],
  }
}

function executeApprovedMcpChange(
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
        oauthClientId: input.oauthClientId,
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

function executeAutomaticMcpChange(
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
        oauthClientId: input.oauthClientId,
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

function readApprovedMcpChangeReceipt(
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
    oauthClientId: row.oauthClientId,
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
    oauthClientId: receipt.oauthClientId,
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

function readAutomaticMcpChangeReceipt(
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
        oauthClientId: row.oauthClientId,
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
    oauthClientId: receipt.oauthClientId,
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

function findCourse(
  database: CourseReadDatabase,
  courseId: CourseId
): Course | null {
  const row = database
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .get()
  if (row === undefined) return null

  return {
    createdAt: new Date(row.createdAt),
    id: createCourseId(row.id),
    publishedCurriculumVersionId:
      row.publishedCurriculumVersionId === null
        ? null
        : readCurriculumVersionId(row.publishedCurriculumVersionId),
    sortOrder: row.sortOrder,
    status: row.status,
  }
}

function readCourseChangeTarget(
  database: CourseReadDatabase,
  courseId: CourseId
): CourseChangeTarget | null {
  const row = database
    .select({
      courseId: courses.id,
      editVersion: courseCurriculumVersions.editVersion,
      status: courses.status,
      title: courseCurriculumVersions.title,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      and(
        eq(courseCurriculumVersions.courseId, courses.id),
        eq(courseCurriculumVersions.status, "draft")
      )
    )
    .where(eq(courses.id, courseId))
    .get()

  return row === undefined
    ? null
    : {
        courseId: createCourseId(row.courseId),
        editVersion: row.editVersion,
        status: row.status,
        title: row.title,
      }
}

function readDraft(
  database: CourseReadDatabase,
  courseId: CourseId
): Result<CurriculumDraft | null, ContentError> {
  const rows = database
    .select({
      category: courseCurriculumVersions.category,
      courseId: courses.id,
      courseStatus: courses.status,
      coverAssetId: courseCurriculumVersions.coverAssetId,
      curriculumVersionId: courseCurriculumVersions.id,
      description: courseCurriculumVersions.description,
      editVersion: courseCurriculumVersions.editVersion,
      revision: courseCurriculumVersions.revision,
      title: courseCurriculumVersions.title,
      visualKey: courseCurriculumVersions.visualKey,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      and(
        eq(courseCurriculumVersions.courseId, courses.id),
        eq(courseCurriculumVersions.status, "draft")
      )
    )
    .where(eq(courses.id, courseId))
    .all()

  if (rows.length > 1) return err({ kind: "content-conflict" })
  const row = rows[0]
  if (row === undefined || row.courseStatus !== activeStatus) return ok(null)

  return createCurriculumDraft({
    category: row.category,
    courseId: createCourseId(row.courseId),
    coverAssetId:
      row.coverAssetId === null ? null : (row.coverAssetId as ContentAssetId),
    curriculumVersionId: readCurriculumVersionId(row.curriculumVersionId),
    description: row.description,
    editVersion: row.editVersion,
    revision: row.revision,
    title: row.title,
    units: readCurriculumUnits(database, row.curriculumVersionId),
    visualKey: readCourseVisualKey(row.visualKey),
  })
}

function readCurriculumUnits(
  database: CourseReadDatabase,
  curriculumVersionId: string
): readonly CurriculumUnit[] {
  const unitRows = database
    .select()
    .from(courseUnitVersions)
    .where(
      and(
        eq(courseUnitVersions.curriculumVersionId, curriculumVersionId),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .orderBy(asc(courseUnitVersions.sortOrder))
    .all()
  const lessonRows = database
    .select()
    .from(lessonVersions)
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, curriculumVersionId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonVersions.sortOrder))
    .all()
  const stepRows = database
    .select()
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, curriculumVersionId),
        eq(lessonStepVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .all()

  return unitRows.map((unit) => ({
    id: readUnitId(unit.id),
    lessons: lessonRows
      .filter((lesson) => lesson.unitId === unit.id)
      .map((lesson) => toCurriculumLesson(lesson, stepRows)),
    sortOrder: unit.sortOrder,
    status: unit.status,
    title: unit.title,
  }))
}

function toCurriculumLesson(
  lesson: typeof lessonVersions.$inferSelect,
  steps: readonly (typeof lessonStepVersions.$inferSelect)[]
): CurriculumLesson {
  return {
    category: lesson.category,
    description: lesson.description,
    estimatedMinutes: lesson.estimatedMinutes,
    id: readLessonId(lesson.id),
    sortOrder: lesson.sortOrder,
    status: lesson.status,
    steps: steps
      .filter((step) => step.lessonId === lesson.id)
      .map(toCurriculumStep),
    summary: readJsonStringArray(lesson.summaryJson),
    title: lesson.title,
  }
}

function toCurriculumStep(
  step: typeof lessonStepVersions.$inferSelect
): CurriculumStep {
  const type = readLessonStepType(step.type)
  if (type === null) throw new Error(`Invalid persisted step type: ${step.id}`)

  return {
    contentJson: step.contentJson,
    id: readLessonStepId(step.id),
    sortOrder: step.sortOrder,
    status: step.status,
    type,
  }
}

function saveDraft(
  database: WritingAppDatabase,
  input: {
    readonly draft: CurriculumDraft
    readonly expectedEditVersion: number
    readonly now: Date
    readonly preserveAssetReferences?: boolean
  }
): Result<CurriculumDraft, ContentError> {
  try {
    return database.transaction((transaction) =>
      saveDraftInTransaction(transaction, input)
    )
  } catch (error) {
    if (error instanceof DraftSaveAbort) return err(error.contentError)
    throw error
  }
}

function saveDraftInTransaction(
  transaction: WritingAppDatabaseTransaction,
  input: {
    readonly draft: CurriculumDraft
    readonly expectedEditVersion: number
    readonly now: Date
    readonly preserveAssetReferences?: boolean
  }
): Result<CurriculumDraft, ContentError> {
  const currentDraft = transaction
    .select({
      courseStatus: courses.status,
      coverAssetId: courseCurriculumVersions.coverAssetId,
      editVersion: courseCurriculumVersions.editVersion,
      id: courseCurriculumVersions.id,
      status: courseCurriculumVersions.status,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      eq(courseCurriculumVersions.courseId, courses.id)
    )
    .where(
      and(
        eq(courses.id, input.draft.courseId),
        eq(courseCurriculumVersions.id, input.draft.curriculumVersionId)
      )
    )
    .get()

  if (
    currentDraft === undefined ||
    currentDraft.courseStatus !== activeStatus
  ) {
    abortDraftSave({ kind: "content-not-found" })
  }
  if (currentDraft.status === "published") {
    abortDraftSave({ kind: "content-immutable-revision" })
  }
  if (
    currentDraft.editVersion !== input.expectedEditVersion ||
    input.draft.editVersion !== input.expectedEditVersion
  ) {
    abortDraftSave({ kind: "content-conflict" })
  }

  const assetReferences = validateAndTransitionDraftAssetReferences(
    transaction,
    {
      currentCoverAssetId:
        currentDraft.coverAssetId === null
          ? null
          : (currentDraft.coverAssetId as ContentAssetId),
      currentDraftId: readCurriculumVersionId(currentDraft.id),
      draft: input.draft,
      now: input.now,
      preserveAssetReferences: input.preserveAssetReferences ?? false,
    }
  )
  if (assetReferences.isErr()) abortDraftSave(assetReferences.error)

  const updatedDraft = transaction
    .update(courseCurriculumVersions)
    .set({
      category: input.draft.category,
      coverAssetId: input.draft.coverAssetId,
      description: input.draft.description,
      editVersion: input.expectedEditVersion + 1,
      title: input.draft.title,
      updatedAt: input.now,
    })
    .where(
      and(
        eq(courseCurriculumVersions.id, currentDraft.id),
        eq(courseCurriculumVersions.editVersion, input.expectedEditVersion),
        eq(courseCurriculumVersions.status, "draft")
      )
    )
    .returning({ id: courseCurriculumVersions.id })
    .get()
  if (updatedDraft === undefined) {
    abortDraftSave({ kind: "content-conflict" })
  }

  deleteDraftContent(transaction, currentDraft.id)
  insertCurriculumContent(transaction, currentDraft.id, input.draft.units)

  const saved = readDraft(transaction, input.draft.courseId)
  if (saved.isErr()) abortDraftSave(saved.error)
  if (saved.value === null) {
    throw new Error("Saved content draft was not found")
  }
  return ok(saved.value)
}

class DraftSaveAbort extends Error {
  readonly contentError: ContentError

  constructor(contentError: ContentError) {
    super(contentError.kind)
    this.name = "DraftSaveAbort"
    this.contentError = contentError
  }
}

function abortDraftSave(contentError: ContentError): never {
  throw new DraftSaveAbort(contentError)
}

type ExpectedAssetReference = Readonly<{
  id: ContentAssetId
  kind: ContentAssetKind
}>

function validateAndTransitionDraftAssetReferences(
  transaction: WritingAppDatabaseTransaction,
  input: {
    readonly currentCoverAssetId: ContentAssetId | null
    readonly currentDraftId: CurriculumVersionId
    readonly draft: CurriculumDraft
    readonly now: Date
    readonly preserveAssetReferences: boolean
  }
): Result<void, ContentError> {
  const currentSteps = transaction
    .select({
      contentJson: lessonStepVersions.contentJson,
      id: lessonStepVersions.id,
      type: lessonStepVersions.type,
    })
    .from(lessonStepVersions)
    .where(eq(lessonStepVersions.curriculumVersionId, input.currentDraftId))
    .all()
  const currentReferences = readExpectedAssetReferences({
    coverAssetId: input.currentCoverAssetId,
    steps: currentSteps,
  })
  const nextReferences = readExpectedAssetReferences({
    coverAssetId: input.draft.coverAssetId,
    steps: input.draft.units.flatMap((unit) =>
      unit.lessons.flatMap((lesson) => lesson.steps)
    ),
  })
  if (currentReferences === null || nextReferences === null) {
    return invalidAssetReference()
  }
  if (
    input.preserveAssetReferences &&
    !hasSameAssetReferences(currentReferences, nextReferences)
  ) {
    return invalidAssetReference()
  }

  const allReferenceIds = [
    ...new Set(
      [...currentReferences.values(), ...nextReferences.values()].map(
        ({ id }) => id
      )
    ),
  ]
  const assets =
    allReferenceIds.length === 0
      ? []
      : transaction
          .select({
            courseId: contentAssets.courseId,
            curriculumVersionId: contentAssets.curriculumVersionId,
            id: contentAssets.id,
            kind: contentAssets.kind,
            orphanedAt: contentAssets.orphanedAt,
            status: contentAssets.status,
            versionStatus: courseCurriculumVersions.status,
          })
          .from(contentAssets)
          .innerJoin(
            courseCurriculumVersions,
            and(
              eq(courseCurriculumVersions.courseId, contentAssets.courseId),
              eq(courseCurriculumVersions.id, contentAssets.curriculumVersionId)
            )
          )
          .where(inArray(contentAssets.id, allReferenceIds))
          .all()
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
  const reactivationCutoff = new Date(
    input.now.getTime() - contentAssetOrphanRetentionMs
  )
  const reactivatedIds: ContentAssetId[] = []

  for (const expected of nextReferences.values()) {
    const asset = assetsById.get(expected.id)
    if (
      asset === undefined ||
      asset.courseId !== input.draft.courseId ||
      asset.kind !== expected.kind ||
      (asset.curriculumVersionId !== input.currentDraftId &&
        asset.versionStatus !== "published")
    ) {
      return invalidAssetReference()
    }
    if (asset.status === "active") continue
    if (
      asset.curriculumVersionId !== input.currentDraftId ||
      asset.orphanedAt === null ||
      asset.orphanedAt <= reactivationCutoff
    ) {
      return invalidAssetReference()
    }
    reactivatedIds.push(expected.id)
  }

  const nextIds = new Set(
    [...nextReferences.values()].map((reference) => reference.id)
  )
  const orphanedIds = [...currentReferences.values()].flatMap(({ id }) => {
    const asset = assetsById.get(id)
    return !nextIds.has(id) &&
      asset?.curriculumVersionId === input.currentDraftId &&
      asset.status === "active"
      ? [id]
      : []
  })

  if (reactivatedIds.length > 0) {
    transaction
      .update(contentAssets)
      .set({
        orphanedAt: null,
        status: "active",
        updatedAt: input.now,
      })
      .where(
        and(
          inArray(contentAssets.id, reactivatedIds),
          eq(contentAssets.curriculumVersionId, input.currentDraftId),
          eq(contentAssets.status, "orphaned")
        )
      )
      .run()
  }
  if (orphanedIds.length > 0) {
    transaction
      .update(contentAssets)
      .set({
        orphanedAt: input.now,
        status: "orphaned",
        updatedAt: input.now,
      })
      .where(
        and(
          inArray(contentAssets.id, orphanedIds),
          eq(contentAssets.curriculumVersionId, input.currentDraftId),
          eq(contentAssets.status, "active")
        )
      )
      .run()
  }

  return ok(undefined)
}

function hasSameAssetReferences(
  current: ReadonlyMap<string, ExpectedAssetReference>,
  next: ReadonlyMap<string, ExpectedAssetReference>
): boolean {
  if (current.size !== next.size) return false
  for (const [location, reference] of current) {
    const nextReference = next.get(location)
    if (
      nextReference?.id !== reference.id ||
      nextReference.kind !== reference.kind
    ) {
      return false
    }
  }
  return true
}

function readExpectedAssetReferences(input: {
  readonly coverAssetId: ContentAssetId | null
  readonly steps: readonly Readonly<{
    contentJson: string
    id: string
    type: string
  }>[]
}): ReadonlyMap<string, ExpectedAssetReference> | null {
  const references = new Map<string, ExpectedAssetReference>()
  if (
    input.coverAssetId !== null &&
    !addExpectedAssetReference(references, "course-cover", {
      id: input.coverAssetId,
      kind: "course-cover",
    })
  ) {
    return null
  }

  for (const step of input.steps) {
    if (step.type !== "READING") continue
    let content: unknown
    try {
      content = JSON.parse(step.contentJson)
    } catch {
      return null
    }
    if (
      typeof content !== "object" ||
      content === null ||
      Array.isArray(content)
    ) {
      return null
    }
    const illustrationAssetId = (
      content as { readonly illustrationAssetId?: unknown }
    ).illustrationAssetId
    if (illustrationAssetId === undefined) continue
    if (
      typeof illustrationAssetId !== "string" ||
      illustrationAssetId.length === 0 ||
      !addExpectedAssetReference(references, `step:${step.id}`, {
        id: illustrationAssetId as ContentAssetId,
        kind: "reading-illustration",
      })
    ) {
      return null
    }
  }

  return references
}

function addExpectedAssetReference(
  references: Map<string, ExpectedAssetReference>,
  location: string,
  reference: ExpectedAssetReference
): boolean {
  if (references.has(location)) return false
  if (
    [...references.values()].some(
      (current) =>
        current.id === reference.id && current.kind !== reference.kind
    )
  ) {
    return false
  }
  references.set(location, reference)
  return true
}

function invalidAssetReference(): Result<never, ContentError> {
  return err({
    kind: "content-validation-failed",
    reason: "invalid-asset-reference",
  })
}

function publishDraft(
  database: WritingAppDatabase,
  input: Parameters<ContentRepository["publishDraft"]>[0]
): Result<PublishedCurriculumRevision, ContentError> {
  return database.transaction((transaction) =>
    publishDraftInTransaction(transaction, input)
  )
}

function publishDraftInTransaction(
  transaction: WritingAppDatabaseTransaction,
  input: Parameters<ContentRepository["publishDraft"]>[0]
): Result<PublishedCurriculumRevision, ContentError> {
  const publishedRevision = input.publishedRevision
  const course = transaction
    .select({ status: courses.status })
    .from(courses)
    .where(eq(courses.id, publishedRevision.courseId))
    .get()
  if (course?.status !== "active") {
    return err({ kind: "content-conflict" })
  }

  const published = transaction
    .update(courseCurriculumVersions)
    .set({
      publishedAt: publishedRevision.publishedAt,
      status: "published",
      updatedAt: publishedRevision.publishedAt,
    })
    .where(
      and(
        eq(courseCurriculumVersions.id, publishedRevision.curriculumVersionId),
        eq(courseCurriculumVersions.editVersion, input.expectedEditVersion),
        eq(courseCurriculumVersions.status, "draft")
      )
    )
    .returning({ id: courseCurriculumVersions.id })
    .get()
  if (published === undefined) return err({ kind: "content-conflict" })

  transaction
    .update(courses)
    .set({
      publishedCurriculumVersionId: publishedRevision.curriculumVersionId,
    })
    .where(eq(courses.id, publishedRevision.courseId))
    .run()

  const nextRevision = publishedRevision.revision + 1
  transaction
    .insert(courseCurriculumVersions)
    .values({
      category: publishedRevision.category,
      courseId: publishedRevision.courseId,
      coverAssetId: publishedRevision.coverAssetId,
      createdAt: publishedRevision.publishedAt,
      description: publishedRevision.description,
      editVersion: 0,
      id: input.nextDraftId,
      publishedAt: null,
      revision: nextRevision,
      status: "draft",
      title: publishedRevision.title,
      updatedAt: publishedRevision.publishedAt,
      visualKey: publishedRevision.visualKey,
    })
    .run()
  insertCurriculumContent(
    transaction,
    input.nextDraftId,
    publishedRevision.units
  )

  return ok(publishedRevision)
}

function insertCurriculumContent(
  transaction: WritingAppDatabaseTransaction,
  curriculumVersionId: string,
  units: readonly CurriculumUnit[]
): void {
  const unitRows = units.map(({ lessons: _lessons, ...unit }) => ({
    ...unit,
    curriculumVersionId,
  }))
  const lessonRows = units.flatMap((unit) =>
    unit.lessons.map(({ steps: _steps, summary, ...lesson }) => ({
      ...lesson,
      curriculumVersionId,
      summaryJson: JSON.stringify(summary),
      unitId: unit.id,
    }))
  )
  const stepRows = units.flatMap((unit) =>
    unit.lessons.flatMap((lesson) =>
      lesson.steps.map((step) => ({
        ...step,
        curriculumVersionId,
        lessonId: lesson.id,
      }))
    )
  )

  if (unitRows.length > 0) {
    transaction.insert(courseUnitVersions).values(unitRows).run()
  }
  if (lessonRows.length > 0) {
    transaction.insert(lessonVersions).values(lessonRows).run()
  }
  if (stepRows.length > 0) {
    transaction.insert(lessonStepVersions).values(stepRows).run()
  }
}

function deleteDraftContent(
  transaction: WritingAppDatabaseTransaction,
  curriculumVersionId: string
): void {
  transaction
    .delete(lessonStepVersions)
    .where(eq(lessonStepVersions.curriculumVersionId, curriculumVersionId))
    .run()
  transaction
    .delete(lessonVersions)
    .where(eq(lessonVersions.curriculumVersionId, curriculumVersionId))
    .run()
  transaction
    .delete(courseUnitVersions)
    .where(eq(courseUnitVersions.curriculumVersionId, curriculumVersionId))
    .run()
}

function saveCourse(
  database: WritingAppDatabase,
  input: {
    readonly course: Course
    readonly expectedStatus: Course["status"]
  }
): Result<Course, ContentError> {
  const updated = database
    .update(courses)
    .set({ status: input.course.status })
    .where(
      and(
        eq(courses.id, input.course.id),
        eq(courses.status, input.expectedStatus)
      )
    )
    .returning({ id: courses.id })
    .get()

  return updated === undefined
    ? err({ kind: "content-conflict" })
    : ok(input.course)
}

function readCourses(
  database: WritingAppDatabase,
  input: ReadContentCoursesInput
): ContentCourseRowPage {
  const category = input.category.trim()
  const whereCondition = createReadCoursesWhereCondition({
    category,
    query: input.query.trim(),
    status: input.status,
  })
  const totalItems =
    database
      .select({ value: count() })
      .from(courses)
      .innerJoin(
        courseCurriculumVersions,
        and(
          eq(courseCurriculumVersions.courseId, courses.id),
          eq(courseCurriculumVersions.status, "draft")
        )
      )
      .where(whereCondition)
      .get()?.value ?? 0
  const pagination = createPageBounds(input, totalItems)
  const unitCountExpression = sql<number>`count(distinct ${courseUnitVersions.id})`
  const lessonCountExpression = sql<number>`count(distinct ${lessonVersions.id})`
  const rows = database
    .select({
      category: courseCurriculumVersions.category,
      coverAssetId: courseCurriculumVersions.coverAssetId,
      id: courses.id,
      lessonCount: lessonCountExpression,
      revision: courseCurriculumVersions.revision,
      status: courses.status,
      title: courseCurriculumVersions.title,
      unitCount: unitCountExpression,
      visualKey: courseCurriculumVersions.visualKey,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      and(
        eq(courseCurriculumVersions.courseId, courses.id),
        eq(courseCurriculumVersions.status, "draft")
      )
    )
    .leftJoin(
      courseUnitVersions,
      and(
        eq(courseUnitVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .leftJoin(
      lessonVersions,
      and(
        eq(lessonVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .where(whereCondition)
    .groupBy(courses.id, courseCurriculumVersions.id)
    .orderBy(asc(courses.sortOrder))
    .limit(pagination.pageSize)
    .offset(pagination.offset)
    .all()

  return {
    items: rows.map(({ coverAssetId, ...row }) => ({
      ...row,
      coverAssetId:
        coverAssetId === null ? null : (coverAssetId as ContentAssetId),
      id: createCourseId(row.id),
      visualKey: readCourseVisualKey(row.visualKey),
    })),
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  }
}

function createReadCoursesWhereCondition({
  category,
  query,
  status,
}: {
  readonly category: string
  readonly query: string
  readonly status: ReadContentCoursesInput["status"]
}) {
  const statusCondition =
    status === "all" ? undefined : eq(courses.status, status)
  const categoryCondition =
    category.length === 0
      ? undefined
      : eq(courseCurriculumVersions.category, category)
  const titleCondition =
    query.length === 0
      ? undefined
      : like(courseCurriculumVersions.title, `%${escapeLikePattern(query)}%`)

  return and(statusCondition, categoryCondition, titleCondition)
}

/** `LIKE` 와일드카드를 포함한 검색어가 조건을 넓히지 않도록 escape한다. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/gu, (match) => `\\${match}`)
}

function listPublishedCourseSummaries(
  database: CourseReadDatabase
): readonly PublishedCourseSummary[] {
  const rows = database
    .select({
      category: courseCurriculumVersions.category,
      courseId: courses.id,
      coverAssetId: courseCurriculumVersions.coverAssetId,
      description: courseCurriculumVersions.description,
      lessonCount: count(lessonVersions.id),
      revision: courseCurriculumVersions.revision,
      sortOrder: courses.sortOrder,
      title: courseCurriculumVersions.title,
      versionId: courseCurriculumVersions.id,
      visualKey: courseCurriculumVersions.visualKey,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
    )
    .leftJoin(
      lessonVersions,
      and(
        eq(lessonVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .where(eq(courses.status, activeStatus))
    .groupBy(courses.id, courseCurriculumVersions.id)
    .orderBy(asc(courses.sortOrder), asc(courses.id))
    .all()

  return rows.map((row) => ({
    ...row,
    courseId: createCourseId(row.courseId),
    coverAssetId:
      row.coverAssetId === null ? null : (row.coverAssetId as ContentAssetId),
    versionId: readCurriculumVersionId(row.versionId),
    visualKey: readCourseVisualKey(row.visualKey),
  }))
}

function readCurriculum(
  database: CourseReadDatabase,
  input: {
    readonly courseId: CourseId
    readonly curriculumVersionId?: CurriculumVersionId
  }
): PublishedCurriculumRevision | null {
  const course = database
    .select()
    .from(courses)
    .where(eq(courses.id, input.courseId))
    .get()
  if (course === undefined) return null
  if (
    input.curriculumVersionId === undefined &&
    course.status !== activeStatus
  ) {
    return null
  }

  const versionId =
    input.curriculumVersionId ?? course.publishedCurriculumVersionId
  if (versionId === null) return null
  const version = database
    .select()
    .from(courseCurriculumVersions)
    .where(
      and(
        eq(courseCurriculumVersions.id, versionId),
        eq(courseCurriculumVersions.courseId, input.courseId),
        eq(courseCurriculumVersions.status, "published")
      )
    )
    .get()
  if (version === undefined || version.publishedAt === null) return null

  return {
    category: version.category,
    courseId: createCourseId(version.courseId),
    coverAssetId:
      version.coverAssetId === null
        ? null
        : (version.coverAssetId as ContentAssetId),
    curriculumVersionId: readCurriculumVersionId(version.id),
    description: version.description,
    publishedAt: new Date(version.publishedAt),
    revision: version.revision,
    title: version.title,
    units: readCurriculumUnits(database, version.id),
    visualKey: readCourseVisualKey(version.visualKey),
  }
}

function findCurriculumByLesson(
  database: CourseReadDatabase,
  input: {
    readonly curriculumVersionId?: CurriculumVersionId
    readonly lessonId: LessonId
  }
): PublishedLessonReference | null {
  const versionCondition =
    input.curriculumVersionId === undefined
      ? and(
          eq(courseCurriculumVersions.courseId, courses.id),
          eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
        )
      : and(
          eq(courseCurriculumVersions.courseId, courses.id),
          eq(courseCurriculumVersions.id, input.curriculumVersionId)
        )
  const row = database
    .select({
      courseId: courses.id,
      curriculumVersionId: courseCurriculumVersions.id,
      lessonId: lessonVersions.id,
      revision: courseCurriculumVersions.revision,
    })
    .from(courses)
    .innerJoin(courseCurriculumVersions, versionCondition)
    .innerJoin(
      lessonVersions,
      and(
        eq(lessonVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(lessonVersions.id, input.lessonId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .where(
      and(
        eq(courseCurriculumVersions.status, "published"),
        input.curriculumVersionId === undefined
          ? eq(courses.status, activeStatus)
          : undefined
      )
    )
    .get()

  return row === undefined
    ? null
    : {
        courseId: createCourseId(row.courseId),
        curriculumVersionId: readCurriculumVersionId(row.curriculumVersionId),
        lessonId: readLessonId(row.lessonId),
        revision: row.revision,
      }
}

function readNextCourseSortOrder(database: CourseReadDatabase): number {
  return (
    database
      .select({
        value: sql<number>`COALESCE(MAX(${courses.sortOrder}), 0) + 1`,
      })
      .from(courses)
      .get()?.value ?? 1
  )
}

function createPageBounds(
  input: { readonly page: number; readonly pageSize: number },
  totalItems: number
) {
  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize))
  const page = Math.min(input.page, totalPages)
  return {
    offset: (page - 1) * input.pageSize,
    page,
    pageSize: input.pageSize,
    totalItems,
    totalPages,
  }
}

function toCourseEditorDocument(draft: CurriculumDraft): CourseEditorDocument {
  const { visualKey: _visualKey, ...document } = draft
  return { ...document, assets: [] }
}

function toContentAsset(row: typeof contentAssets.$inferSelect): ContentAsset {
  return {
    ...row,
    courseId: createCourseId(row.courseId),
    curriculumVersionId: readCurriculumVersionId(row.curriculumVersionId),
    id: row.id as ContentAssetId,
    orphanedAt: row.orphanedAt === null ? null : new Date(row.orphanedAt),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

function readJsonStringArray(value: string): readonly string[] {
  const parsed: unknown = JSON.parse(value)
  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === "string")
  ) {
    throw new Error("Invalid persisted lesson summary")
  }
  return parsed
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes("UNIQUE constraint failed")
  )
}

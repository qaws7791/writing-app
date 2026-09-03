import { and, asc, eq, inArray } from "drizzle-orm"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  CourseId,
  ContentAssetId,
  CurriculumVersionId,
} from "@workspace/types/ids"

import type { ContentError } from "#content/domain/content-error"
import {
  contentAssetOrphanRetentionMs,
  type ContentAssetKind,
} from "#content/domain/content-asset"
import {
  createCourseId,
  readCourseVisualKey,
  readCurriculumVersionId,
  readLessonId,
  readLessonStepId,
  readLessonStepType,
  readUnitId,
  type CurriculumDraft,
  type CurriculumLesson,
  type CurriculumStep,
  type CurriculumUnit,
  type PublishedCurriculumRevision,
} from "#content/domain/content-model"
import { createCurriculumDraft } from "#content/domain/curriculum"
import type { ContentRepository } from "#content/application/ports/content-ports"
import {
  activeStatus,
  type CourseReadDatabase,
  type WritingAppDatabaseTransaction,
} from "#content/infrastructure/persistence/content-drizzle-shared"
import {
  contentAssets,
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "#content/infrastructure/persistence/schema"

export function readDraft(
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

export function readCurriculumUnits(
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

export function saveDraft(
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

export function saveDraftInTransaction(
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

export class DraftSaveAbort extends Error {
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

export function publishDraft(
  database: WritingAppDatabase,
  input: Parameters<ContentRepository["publishDraft"]>[0]
): Result<PublishedCurriculumRevision, ContentError> {
  return database.transaction((transaction) =>
    publishDraftInTransaction(transaction, input)
  )
}

export function publishDraftInTransaction(
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

import { and, asc, eq, inArray } from "drizzle-orm"

import type { WritingAppDatabase } from "@/client"
import {
  courseProgress,
  curriculumMigrationApplications,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersionMigrations,
  curriculumVersions,
  lessonMigrationMappings,
  lessonProgress,
  lessonSteps,
} from "@/schema"

type CurriculumVersionMigrationRow =
  typeof curriculumVersionMigrations.$inferSelect
type LessonMigrationMappingRow = typeof lessonMigrationMappings.$inferSelect
type CurriculumMigrationApplicationRow =
  typeof curriculumMigrationApplications.$inferSelect

export interface CurriculumMigrationDetailRecord {
  id: string
  fromVersionId: string
  toVersionId: string
  status: "active" | "archived"
  mappings: {
    id: string
    fromLessonId: string
    toLessonId: string | null
    mappingType: "equivalent" | "split" | "merged" | "removed"
  }[]
}

export interface CurriculumMigrationApplicationRecord {
  completedLessonCount: number
  completedLessonIds: string[]
  courseId: string
  createdAt: Date
  errorMessage: string | null
  fromVersionId: string
  id: string
  migrationId: string
  preservedLessonIds: string[]
  skippedLessonIds: string[]
  status: "completed" | "failed"
  toVersionId: string
  updatedAt: Date
  userId: string
}

interface MigrationApplicationResultJson {
  completedLessonIds: string[]
  preservedLessonIds: string[]
  skippedLessonIds: string[]
}

export type ApplyCurriculumMigrationToUserResult =
  | {
      status: "applied"
      application: CurriculumMigrationApplicationRecord
    }
  | {
      status: "invalid-request"
      error: {
        code: "invalid-request"
        message: string
      }
    }
  | {
      status: "not-found"
      error: {
        code: "not-found"
        message: string
      }
    }

export async function findCurriculumMigrationForApplication(
  db: Pick<WritingAppDatabase, "select">,
  migrationId: string
): Promise<CurriculumMigrationDetailRecord | undefined> {
  const [migration] = await db
    .select()
    .from(curriculumVersionMigrations)
    .where(eq(curriculumVersionMigrations.id, migrationId))
    .limit(1)

  if (!migration) {
    return undefined
  }

  const mappings = await db
    .select()
    .from(lessonMigrationMappings)
    .where(eq(lessonMigrationMappings.migrationId, migration.id))
    .orderBy(asc(lessonMigrationMappings.id))

  return mapCurriculumMigration(migration, mappings)
}

export async function applyCurriculumMigrationToUser(
  db: WritingAppDatabase,
  input: {
    migrationId: string
    now: Date
    userId: string
  }
): Promise<ApplyCurriculumMigrationToUserResult> {
  const migration = await findCurriculumMigrationForApplication(
    db,
    input.migrationId
  )

  if (!migration) {
    return {
      status: "not-found",
      error: {
        code: "not-found",
        message: "Curriculum migration was not found.",
      },
    }
  }

  const versions = await db
    .select()
    .from(curriculumVersions)
    .where(
      inArray(curriculumVersions.id, [
        migration.fromVersionId,
        migration.toVersionId,
      ])
    )
  const fromVersion = versions.find(
    (version) => version.id === migration.fromVersionId
  )
  const toVersion = versions.find(
    (version) => version.id === migration.toVersionId
  )

  if (!fromVersion || !toVersion) {
    return {
      status: "not-found",
      error: {
        code: "not-found",
        message: "Curriculum version was not found.",
      },
    }
  }

  const [existingApplication] = await db
    .select()
    .from(curriculumMigrationApplications)
    .where(
      and(
        eq(curriculumMigrationApplications.migrationId, migration.id),
        eq(curriculumMigrationApplications.userId, input.userId),
        eq(curriculumMigrationApplications.status, "completed")
      )
    )
    .limit(1)

  if (existingApplication) {
    return {
      status: "applied",
      application: mapCurriculumMigrationApplication(existingApplication),
    }
  }

  const [progress] = await db
    .select()
    .from(courseProgress)
    .where(
      and(
        eq(courseProgress.userId, input.userId),
        eq(courseProgress.courseId, fromVersion.courseId)
      )
    )
    .limit(1)

  if (!progress) {
    return {
      status: "not-found",
      error: {
        code: "not-found",
        message: "Course progress was not found.",
      },
    }
  }

  if (progress.curriculumVersionId !== migration.fromVersionId) {
    const message = "Course progress is not on the migration source version."
    await recordFailedCurriculumMigrationApplication(db, {
      courseId: fromVersion.courseId,
      errorMessage: message,
      fromVersionId: migration.fromVersionId,
      migrationId: migration.id,
      now: input.now,
      toVersionId: migration.toVersionId,
      userId: input.userId,
    })

    return {
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message,
      },
    }
  }

  return db.transaction(async (tx) => {
    const completedSourceRows = await tx
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, input.userId),
          eq(lessonProgress.courseId, fromVersion.courseId),
          eq(lessonProgress.curriculumVersionId, migration.fromVersionId),
          eq(lessonProgress.status, "completed")
        )
      )
    const completedSourceLessonIds = new Set(
      completedSourceRows.map((row) => row.lessonId)
    )
    const targetLessonIds = await listActiveCurriculumVersionLessonIds(
      tx,
      migration.toVersionId
    )
    const completedTargetLessonIds = resolveCompletedTargetLessonIds(
      migration.mappings,
      completedSourceLessonIds
    )
    const targetLessonOrder = new Map(
      targetLessonIds.map((lessonId, index) => [lessonId, index])
    )
    const completedLessonIds = [...completedTargetLessonIds]
      .filter((lessonId) => targetLessonOrder.has(lessonId))
      .sort(
        (left, right) =>
          (targetLessonOrder.get(left) ?? 0) -
          (targetLessonOrder.get(right) ?? 0)
      )
    const preservedLessonIds = migration.mappings
      .filter(
        (mapping) =>
          mapping.mappingType === "removed" &&
          completedSourceLessonIds.has(mapping.fromLessonId)
      )
      .map((mapping) => mapping.fromLessonId)
    const skippedLessonIds = migration.mappings
      .filter((mapping) => !completedSourceLessonIds.has(mapping.fromLessonId))
      .map((mapping) => mapping.fromLessonId)
    const finalStepByLessonId = await listFinalStepByLessonId(
      tx,
      completedLessonIds
    )

    for (const lessonId of completedLessonIds) {
      const finalStep = finalStepByLessonId.get(lessonId)

      if (!finalStep) {
        throw new Error(`Lesson final step was not found: ${lessonId}`)
      }

      await tx
        .insert(lessonProgress)
        .values({
          userId: input.userId,
          lessonId,
          courseId: fromVersion.courseId,
          curriculumVersionId: migration.toVersionId,
          currentStepId: finalStep.id,
          stepOrder: finalStep.sortOrder,
          status: "completed",
          completedAt: input.now,
          updatedAt: input.now,
        })
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId],
          set: {
            courseId: fromVersion.courseId,
            curriculumVersionId: migration.toVersionId,
            currentStepId: finalStep.id,
            stepOrder: finalStep.sortOrder,
            status: "completed",
            completedAt: input.now,
            updatedAt: input.now,
          },
        })
    }

    await tx
      .update(courseProgress)
      .set({
        curriculumVersionId: migration.toVersionId,
        completedCount: completedLessonIds.length,
        lastLessonId: completedLessonIds.at(-1) ?? null,
        updatedAt: input.now,
      })
      .where(
        and(
          eq(courseProgress.userId, input.userId),
          eq(courseProgress.courseId, fromVersion.courseId)
        )
      )

    const application = {
      id: `${migration.id}-${input.userId}`,
      migrationId: migration.id,
      userId: input.userId,
      courseId: fromVersion.courseId,
      fromVersionId: migration.fromVersionId,
      toVersionId: migration.toVersionId,
      status: "completed",
      completedLessonCount: completedLessonIds.length,
      resultJson: JSON.stringify({
        completedLessonIds,
        preservedLessonIds,
        skippedLessonIds: [...new Set(skippedLessonIds)],
      } satisfies MigrationApplicationResultJson),
      errorMessage: null,
      createdAt: input.now,
      updatedAt: input.now,
    } satisfies typeof curriculumMigrationApplications.$inferInsert

    await tx
      .insert(curriculumMigrationApplications)
      .values(application)
      .onConflictDoUpdate({
        target: [
          curriculumMigrationApplications.migrationId,
          curriculumMigrationApplications.userId,
        ],
        set: {
          completedLessonCount: application.completedLessonCount,
          resultJson: application.resultJson,
          errorMessage: application.errorMessage,
          status: application.status,
          updatedAt: input.now,
        },
      })

    return {
      status: "applied",
      application: mapCurriculumMigrationApplication(application),
    }
  })
}

function mapCurriculumMigration(
  migration: CurriculumVersionMigrationRow,
  mappings: LessonMigrationMappingRow[]
): CurriculumMigrationDetailRecord {
  return {
    id: migration.id,
    fromVersionId: migration.fromVersionId,
    toVersionId: migration.toVersionId,
    status: migration.status,
    mappings: mappings.map((mapping) => ({
      id: mapping.id,
      fromLessonId: mapping.fromLessonId,
      toLessonId: mapping.toLessonId,
      mappingType: mapping.mappingType,
    })),
  }
}

async function listActiveCurriculumVersionLessonIds(
  db: Pick<WritingAppDatabase, "select">,
  curriculumVersionId: string
) {
  const rows = await db
    .select({ lessonId: curriculumVersionLessons.lessonId })
    .from(curriculumVersionChapters)
    .innerJoin(
      curriculumVersionLessons,
      eq(curriculumVersionLessons.chapterId, curriculumVersionChapters.id)
    )
    .where(
      and(
        eq(curriculumVersionChapters.curriculumVersionId, curriculumVersionId),
        eq(curriculumVersionChapters.status, "active"),
        eq(curriculumVersionLessons.status, "active")
      )
    )
    .orderBy(
      asc(curriculumVersionChapters.sortOrder),
      asc(curriculumVersionLessons.sortOrder)
    )

  return rows.map((row) => row.lessonId)
}

function resolveCompletedTargetLessonIds(
  mappings: CurriculumMigrationDetailRecord["mappings"],
  completedSourceLessonIds: Set<string>
) {
  const completedTargetLessonIds = new Set<string>()
  const mergedMappingsByTargetLessonId = new Map<
    string,
    CurriculumMigrationDetailRecord["mappings"]
  >()

  for (const mapping of mappings) {
    if (mapping.mappingType === "removed" || !mapping.toLessonId) {
      continue
    }

    if (mapping.mappingType === "merged") {
      const group = mergedMappingsByTargetLessonId.get(mapping.toLessonId) ?? []
      group.push(mapping)
      mergedMappingsByTargetLessonId.set(mapping.toLessonId, group)
      continue
    }

    if (completedSourceLessonIds.has(mapping.fromLessonId)) {
      completedTargetLessonIds.add(mapping.toLessonId)
    }
  }

  for (const [
    targetLessonId,
    mergedMappings,
  ] of mergedMappingsByTargetLessonId) {
    if (
      mergedMappings.every((mapping) =>
        completedSourceLessonIds.has(mapping.fromLessonId)
      )
    ) {
      completedTargetLessonIds.add(targetLessonId)
    }
  }

  return completedTargetLessonIds
}

async function listFinalStepByLessonId(
  db: Pick<WritingAppDatabase, "select">,
  lessonIds: string[]
) {
  if (lessonIds.length === 0) {
    return new Map<string, { id: string; sortOrder: number }>()
  }

  const stepRows = await db
    .select({
      id: lessonSteps.id,
      lessonId: lessonSteps.lessonId,
      sortOrder: lessonSteps.sortOrder,
    })
    .from(lessonSteps)
    .where(inArray(lessonSteps.lessonId, lessonIds))
    .orderBy(asc(lessonSteps.lessonId), asc(lessonSteps.sortOrder))

  return stepRows.reduce((stepsByLessonId, step) => {
    stepsByLessonId.set(step.lessonId, {
      id: step.id,
      sortOrder: step.sortOrder,
    })

    return stepsByLessonId
  }, new Map<string, { id: string; sortOrder: number }>())
}

async function recordFailedCurriculumMigrationApplication(
  db: Pick<WritingAppDatabase, "insert">,
  input: {
    courseId: string
    errorMessage: string
    fromVersionId: string
    migrationId: string
    now: Date
    toVersionId: string
    userId: string
  }
) {
  const failedApplication = {
    id: `${input.migrationId}-${input.userId}`,
    migrationId: input.migrationId,
    userId: input.userId,
    courseId: input.courseId,
    fromVersionId: input.fromVersionId,
    toVersionId: input.toVersionId,
    status: "failed",
    completedLessonCount: 0,
    resultJson: JSON.stringify({
      completedLessonIds: [],
      preservedLessonIds: [],
      skippedLessonIds: [],
    } satisfies MigrationApplicationResultJson),
    errorMessage: input.errorMessage,
    createdAt: input.now,
    updatedAt: input.now,
  } satisfies typeof curriculumMigrationApplications.$inferInsert

  await db
    .insert(curriculumMigrationApplications)
    .values(failedApplication)
    .onConflictDoUpdate({
      target: [
        curriculumMigrationApplications.migrationId,
        curriculumMigrationApplications.userId,
      ],
      set: {
        completedLessonCount: failedApplication.completedLessonCount,
        errorMessage: failedApplication.errorMessage,
        resultJson: failedApplication.resultJson,
        status: failedApplication.status,
        updatedAt: input.now,
      },
    })
}

function mapCurriculumMigrationApplication(
  application: CurriculumMigrationApplicationRow
): CurriculumMigrationApplicationRecord {
  const result = parseMigrationApplicationResult(application.resultJson)

  return {
    id: application.id,
    migrationId: application.migrationId,
    userId: application.userId,
    courseId: application.courseId,
    fromVersionId: application.fromVersionId,
    toVersionId: application.toVersionId,
    status: application.status,
    completedLessonCount: application.completedLessonCount,
    completedLessonIds: result.completedLessonIds,
    preservedLessonIds: result.preservedLessonIds,
    skippedLessonIds: result.skippedLessonIds,
    errorMessage: application.errorMessage,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  }
}

function parseMigrationApplicationResult(
  resultJson: string
): MigrationApplicationResultJson {
  const fallback = {
    completedLessonIds: [],
    preservedLessonIds: [],
    skippedLessonIds: [],
  }

  try {
    const parsed: unknown = JSON.parse(resultJson)

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray(
        (parsed as MigrationApplicationResultJson).completedLessonIds
      ) &&
      Array.isArray(
        (parsed as MigrationApplicationResultJson).preservedLessonIds
      ) &&
      Array.isArray((parsed as MigrationApplicationResultJson).skippedLessonIds)
    ) {
      return parsed as MigrationApplicationResultJson
    }
  } catch {
    return fallback
  }

  return fallback
}

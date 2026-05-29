import { and, asc, count, desc, eq } from "drizzle-orm"

import type {
  CourseId,
  CurriculumVersionId,
  LessonId,
} from "@workspace/core/content"
import type {
  CompleteLessonRecord,
  CurriculumUpgradeApplicationRecord,
  LearningRepository,
  LessonAnswerRecord,
  LessonProgressRecord,
} from "@workspace/core/learning"

import type { WritingAppDatabase } from "@/client"
import { applyCurriculumMigrationToUser } from "@/repositories/curriculum-migration-application"
import {
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
} from "@/schema/content.schema"
import {
  curriculumUpgradeDismissals,
  curriculumVersionMigrations,
} from "@/schema/curriculum-migration.schema"
import {
  courseProgress,
  lessonAnswers,
  lessonProgress,
} from "@/schema/learning.schema"

type CourseProgressRow = typeof courseProgress.$inferSelect
type LessonProgressRow = typeof lessonProgress.$inferSelect
type LessonAnswerRow = typeof lessonAnswers.$inferSelect

export interface DrizzleLearningRepositoryOptions {
  now?: () => Date
}

export function createDrizzleLearningRepository(
  db: WritingAppDatabase,
  options: DrizzleLearningRepositoryOptions = {}
): LearningRepository {
  const now = options.now ?? (() => new Date())

  return {
    async findCourseProgress(userId, courseId) {
      const [row] = await db
        .select()
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.userId, userId),
            eq(courseProgress.courseId, courseId)
          )
        )
        .limit(1)

      return row ? mapCourseProgress(row) : undefined
    },

    async findCurriculumUpgrade(userId, courseId) {
      return findCurriculumUpgradeCandidate(db, userId, courseId, {
        includeDismissed: false,
      })
    },

    async applyCurriculumUpgrade(userId, courseId) {
      const candidate = await findCurriculumUpgradeCandidate(
        db,
        userId,
        courseId,
        {
          includeDismissed: false,
        }
      )

      if (!candidate) {
        return curriculumUpgradeNotFound()
      }

      const result = await applyCurriculumMigrationToUser(db, {
        migrationId: candidate.migrationId,
        now: now(),
        userId,
      })

      if (result.status !== "applied") {
        return result
      }

      return {
        status: "applied",
        application: mapCurriculumUpgradeApplication(result.application),
      }
    },

    async dismissCurriculumUpgrade(userId, courseId) {
      const candidate = await findCurriculumUpgradeCandidate(
        db,
        userId,
        courseId,
        {
          includeDismissed: true,
        }
      )

      if (!candidate) {
        return curriculumUpgradeNotFound()
      }

      const currentTime = now()
      const dismissal = {
        id: `${userId}-${candidate.migrationId}`,
        userId,
        courseId,
        fromVersionId: candidate.fromVersion.id,
        toVersionId: candidate.toVersion.id,
        createdAt: currentTime,
        updatedAt: currentTime,
      } satisfies typeof curriculumUpgradeDismissals.$inferInsert

      await db
        .insert(curriculumUpgradeDismissals)
        .values(dismissal)
        .onConflictDoUpdate({
          target: [
            curriculumUpgradeDismissals.userId,
            curriculumUpgradeDismissals.courseId,
            curriculumUpgradeDismissals.fromVersionId,
            curriculumUpgradeDismissals.toVersionId,
          ],
          set: {
            updatedAt: currentTime,
          },
        })

      return {
        status: "dismissed",
        dismissal: {
          courseId,
          dismissedAt: currentTime,
          fromVersionId: candidate.fromVersion.id,
          toVersionId: candidate.toVersion.id,
        },
      }
    },

    async upsertCourseProgress(input) {
      const currentTime = now()

      await db
        .insert(courseProgress)
        .values({
          userId: input.userId,
          courseId: input.courseId,
          curriculumVersionId: input.curriculumVersionId,
          startedAt: currentTime,
          lastLessonId: input.lastLessonId,
          updatedAt: currentTime,
        })
        .onConflictDoUpdate({
          target: [courseProgress.userId, courseProgress.courseId],
          set: {
            curriculumVersionId: input.curriculumVersionId,
            lastLessonId: input.lastLessonId,
            updatedAt: currentTime,
          },
        })
    },

    async findLessonProgress(userId, lessonId) {
      const [row] = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, lessonId)
          )
        )
        .limit(1)

      return row ? mapLessonProgress(row) : undefined
    },

    async upsertLessonProgress(input) {
      const currentTime = now()

      await db
        .insert(lessonProgress)
        .values({
          userId: input.userId,
          lessonId: input.lessonId,
          courseId: input.courseId,
          curriculumVersionId: input.curriculumVersionId,
          currentStepId: input.currentStepId,
          stepOrder: input.stepOrder,
          status: input.status,
          updatedAt: currentTime,
        })
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId],
          set: {
            courseId: input.courseId,
            curriculumVersionId: input.curriculumVersionId,
            currentStepId: input.currentStepId,
            stepOrder: input.stepOrder,
            status: input.status,
            updatedAt: currentTime,
          },
        })

      const progress = await this.findLessonProgress(
        input.userId,
        input.lessonId
      )

      if (!progress) {
        throw new Error("Lesson progress was not saved.")
      }

      return progress
    },

    async listLessonProgressByCourse(userId, courseId, curriculumVersionId) {
      const rows = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.courseId, courseId),
            eq(lessonProgress.curriculumVersionId, curriculumVersionId)
          )
        )
        .orderBy(asc(lessonProgress.lessonId))

      return rows.map(mapLessonProgress)
    },

    async findLatestPublishedCurriculumVersionId(courseId) {
      const [version] = await db
        .select()
        .from(curriculumVersions)
        .where(
          and(
            eq(curriculumVersions.courseId, courseId),
            eq(curriculumVersions.status, "published")
          )
        )
        .orderBy(desc(curriculumVersions.versionNumber))
        .limit(1)

      return version?.id as CurriculumVersionId | undefined
    },

    async listCurriculumVersionLessonIds(curriculumVersionId) {
      return listActiveCurriculumVersionLessonIds(db, curriculumVersionId)
    },

    async curriculumVersionIncludesLesson(curriculumVersionId, lessonId) {
      const [row] = await db
        .select({ id: curriculumVersionLessons.id })
        .from(curriculumVersionChapters)
        .innerJoin(
          curriculumVersionLessons,
          eq(curriculumVersionLessons.chapterId, curriculumVersionChapters.id)
        )
        .where(
          and(
            eq(
              curriculumVersionChapters.curriculumVersionId,
              curriculumVersionId
            ),
            eq(curriculumVersionChapters.status, "active"),
            eq(curriculumVersionLessons.lessonId, lessonId),
            eq(curriculumVersionLessons.status, "active")
          )
        )
        .limit(1)

      return Boolean(row)
    },

    async listInProgressCourses(userId) {
      const rows = await db
        .select()
        .from(courseProgress)
        .where(eq(courseProgress.userId, userId))
        .orderBy(desc(courseProgress.updatedAt))

      return rows.map(mapCourseProgress)
    },

    async listLessonAnswers(userId, lessonId) {
      const rows = await db
        .select()
        .from(lessonAnswers)
        .where(
          and(
            eq(lessonAnswers.userId, userId),
            eq(lessonAnswers.lessonId, lessonId)
          )
        )
        .orderBy(asc(lessonAnswers.stepId))

      return rows.map(mapLessonAnswer)
    },

    async upsertLessonAnswer(input) {
      const currentTime = now()

      await db
        .insert(lessonAnswers)
        .values({
          userId: input.userId,
          lessonId: input.lessonId,
          stepId: input.stepId,
          answer: input.answer,
          updatedAt: currentTime,
        })
        .onConflictDoUpdate({
          target: [
            lessonAnswers.userId,
            lessonAnswers.lessonId,
            lessonAnswers.stepId,
          ],
          set: {
            answer: input.answer,
            updatedAt: currentTime,
          },
        })
    },

    async completeLesson(input) {
      const existingProgress = await this.findLessonProgress(
        input.userId,
        input.lessonId
      )
      const currentTime = now()
      const completedAt =
        existingProgress?.status === "completed" && existingProgress.completedAt
          ? existingProgress.completedAt
          : currentTime
      const wasAlreadyCompleted = existingProgress?.status === "completed"

      await db
        .insert(lessonProgress)
        .values({
          userId: input.userId,
          lessonId: input.lessonId,
          courseId: input.courseId,
          curriculumVersionId: input.curriculumVersionId,
          currentStepId: input.finalStepId,
          stepOrder: input.stepOrder,
          status: "completed",
          completedAt,
          updatedAt: currentTime,
        })
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId],
          set: {
            courseId: input.courseId,
            curriculumVersionId: input.curriculumVersionId,
            currentStepId: input.finalStepId,
            stepOrder: input.stepOrder,
            status: "completed",
            completedAt,
            updatedAt: currentTime,
          },
        })

      const completedCount = await countCompletedLessons(
        db,
        input.userId,
        input.courseId,
        input.curriculumVersionId
      )

      await db
        .insert(courseProgress)
        .values({
          userId: input.userId,
          courseId: input.courseId,
          curriculumVersionId: input.curriculumVersionId,
          startedAt: currentTime,
          lastLessonId: input.lessonId,
          completedCount,
          updatedAt: currentTime,
        })
        .onConflictDoUpdate({
          target: [courseProgress.userId, courseProgress.courseId],
          set: {
            curriculumVersionId: input.curriculumVersionId,
            lastLessonId: input.lessonId,
            completedCount,
            updatedAt: currentTime,
          },
        })

      return {
        completedAt,
        completedCount,
        wasAlreadyCompleted,
      } satisfies CompleteLessonRecord
    },
  }
}

async function countCompletedLessons(
  db: WritingAppDatabase,
  userId: string,
  courseId: string,
  curriculumVersionId: string
): Promise<number> {
  const [row] = await db
    .select({ completedCount: count() })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.courseId, courseId),
        eq(lessonProgress.curriculumVersionId, curriculumVersionId),
        eq(lessonProgress.status, "completed")
      )
    )

  return row?.completedCount ?? 0
}

async function findCurriculumUpgradeCandidate(
  db: WritingAppDatabase,
  userId: string,
  courseId: string,
  options: {
    includeDismissed: boolean
  }
) {
  const [progress] = await db
    .select()
    .from(courseProgress)
    .where(
      and(
        eq(courseProgress.userId, userId),
        eq(courseProgress.courseId, courseId)
      )
    )
    .limit(1)

  if (!progress?.curriculumVersionId) {
    return undefined
  }

  const [latestVersion] = await db
    .select()
    .from(curriculumVersions)
    .where(
      and(
        eq(curriculumVersions.courseId, courseId),
        eq(curriculumVersions.status, "published")
      )
    )
    .orderBy(desc(curriculumVersions.versionNumber))
    .limit(1)

  if (!latestVersion || latestVersion.id === progress.curriculumVersionId) {
    return undefined
  }

  const [fromVersion] = await db
    .select()
    .from(curriculumVersions)
    .where(eq(curriculumVersions.id, progress.curriculumVersionId))
    .limit(1)

  if (!fromVersion) {
    return undefined
  }

  const [migration] = await db
    .select()
    .from(curriculumVersionMigrations)
    .where(
      and(
        eq(curriculumVersionMigrations.fromVersionId, fromVersion.id),
        eq(curriculumVersionMigrations.toVersionId, latestVersion.id),
        eq(curriculumVersionMigrations.status, "active")
      )
    )
    .limit(1)

  if (!migration) {
    return undefined
  }

  if (!options.includeDismissed) {
    const [dismissal] = await db
      .select({ id: curriculumUpgradeDismissals.id })
      .from(curriculumUpgradeDismissals)
      .where(
        and(
          eq(curriculumUpgradeDismissals.userId, userId),
          eq(curriculumUpgradeDismissals.courseId, courseId),
          eq(curriculumUpgradeDismissals.fromVersionId, fromVersion.id),
          eq(curriculumUpgradeDismissals.toVersionId, latestVersion.id)
        )
      )
      .limit(1)

    if (dismissal) {
      return undefined
    }
  }

  const targetLessonIds = await listActiveCurriculumVersionLessonIds(
    db,
    latestVersion.id as CurriculumVersionId
  )

  return {
    completedCount: progress.completedCount,
    courseId: courseId as CourseId,
    fromVersion: {
      id: fromVersion.id as CurriculumVersionId,
      title: fromVersion.title,
      versionNumber: fromVersion.versionNumber,
    },
    migrationId: migration.id,
    toVersion: {
      changelog: latestVersion.changelog,
      id: latestVersion.id as CurriculumVersionId,
      title: latestVersion.title,
      versionNumber: latestVersion.versionNumber,
    },
    totalLessons: targetLessonIds.length,
  }
}

async function listActiveCurriculumVersionLessonIds(
  db: Pick<WritingAppDatabase, "select">,
  curriculumVersionId: CurriculumVersionId
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

  return rows.map((row) => row.lessonId as LessonId)
}

function mapCurriculumUpgradeApplication(application: {
  completedLessonCount: number
  completedLessonIds: string[]
  courseId: string
  createdAt: Date
  fromVersionId: string
  id: string
  migrationId: string
  preservedLessonIds: string[]
  skippedLessonIds: string[]
  status: "completed" | "failed"
  toVersionId: string
  updatedAt: Date
}): CurriculumUpgradeApplicationRecord {
  if (application.status !== "completed") {
    throw new Error("Applied curriculum upgrade must be completed.")
  }

  return {
    completedLessonCount: application.completedLessonCount,
    completedLessonIds: application.completedLessonIds.map(
      (lessonId) => lessonId as LessonId
    ),
    courseId: application.courseId as CourseId,
    createdAt: application.createdAt,
    fromVersionId: application.fromVersionId as CurriculumVersionId,
    id: application.id,
    migrationId: application.migrationId,
    preservedLessonIds: application.preservedLessonIds.map(
      (lessonId) => lessonId as LessonId
    ),
    skippedLessonIds: application.skippedLessonIds.map(
      (lessonId) => lessonId as LessonId
    ),
    status: application.status,
    toVersionId: application.toVersionId as CurriculumVersionId,
    updatedAt: application.updatedAt,
  }
}

function curriculumUpgradeNotFound() {
  return {
    status: "not-found",
    error: {
      code: "not-found",
      message: "커리큘럼 업그레이드를 찾을 수 없습니다.",
    },
  } as const
}

function mapCourseProgress(row: CourseProgressRow) {
  if (!row.curriculumVersionId) {
    throw new Error("Course progress is missing curriculum version.")
  }

  return {
    completedCount: row.completedCount,
    courseId: row.courseId as CourseId,
    curriculumVersionId: row.curriculumVersionId as CurriculumVersionId,
    lastLessonId: row.lastLessonId ? (row.lastLessonId as LessonId) : undefined,
  }
}

function mapLessonProgress(row: LessonProgressRow): LessonProgressRecord {
  if (!row.curriculumVersionId) {
    throw new Error("Lesson progress is missing curriculum version.")
  }

  return {
    completedAt: row.completedAt,
    courseId: row.courseId as CourseId,
    curriculumVersionId: row.curriculumVersionId as CurriculumVersionId,
    currentStepId: row.currentStepId,
    lessonId: row.lessonId as LessonId,
    status: row.status,
    stepOrder: row.stepOrder,
  }
}

function mapLessonAnswer(row: LessonAnswerRow): LessonAnswerRecord {
  return {
    answer: row.answer,
    lessonId: row.lessonId as LessonId,
    stepId: row.stepId,
  }
}

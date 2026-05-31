import { and, asc, count, desc, eq } from "drizzle-orm"

import type { CourseId, LessonId } from "@workspace/core/content"
import type {
  CompleteLessonRecord,
  LearningRepository,
  LessonAnswerRecord,
  LessonProgressRecord,
} from "@workspace/core/learning"

import type { WritingAppDatabase } from "../client"
import {
  courseChapters,
  courseLessons,
  courses,
} from "../schema/content.schema"
import {
  courseProgress,
  lessonAnswers,
  lessonProgress,
} from "../schema/learning.schema"

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

    async upsertCourseProgress(input) {
      const currentTime = now()

      await db
        .insert(courseProgress)
        .values({
          userId: input.userId,
          courseId: input.courseId,
          startedAt: currentTime,
          lastLessonId: input.lastLessonId,
          updatedAt: currentTime,
        })
        .onConflictDoUpdate({
          target: [courseProgress.userId, courseProgress.courseId],
          set: {
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
          currentStepId: input.currentStepId,
          stepOrder: input.stepOrder,
          status: input.status,
          updatedAt: currentTime,
        })
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId],
          set: {
            courseId: input.courseId,
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

    async listLessonProgressByCourse(userId, courseId) {
      const rows = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.courseId, courseId)
          )
        )
        .orderBy(asc(lessonProgress.lessonId))

      return rows.map(mapLessonProgress)
    },

    async listCourseLessonIds(courseId) {
      return listActiveCourseLessonIds(db, courseId)
    },

    async courseIncludesLesson(courseId, lessonId) {
      const [row] = await db
        .select({ id: courseLessons.id })
        .from(courseChapters)
        .innerJoin(
          courseLessons,
          eq(courseLessons.chapterId, courseChapters.id)
        )
        .where(
          and(
            eq(courseChapters.courseId, courseId),
            eq(courseChapters.status, "active"),
            eq(courseLessons.lessonId, lessonId),
            eq(courseLessons.status, "active")
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

    async listProgressSummaries(userId) {
      const rows = await db
        .select({
          courseDescription: courses.description,
          courseId: courses.id,
          courseTitle: courses.title,
          lessonId: courseLessons.lessonId,
          lessonStatus: lessonProgress.status,
          lessonTitle: courseLessons.title,
        })
        .from(courseProgress)
        .innerJoin(courses, eq(courses.id, courseProgress.courseId))
        .innerJoin(
          courseChapters,
          and(
            eq(courseChapters.courseId, courses.id),
            eq(courseChapters.status, "active")
          )
        )
        .innerJoin(
          courseLessons,
          and(
            eq(courseLessons.chapterId, courseChapters.id),
            eq(courseLessons.status, "active")
          )
        )
        .leftJoin(
          lessonProgress,
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, courseLessons.lessonId)
          )
        )
        .where(eq(courseProgress.userId, userId))
        .orderBy(
          desc(courseProgress.updatedAt),
          asc(courseChapters.sortOrder),
          asc(courseLessons.sortOrder)
        )

      return mapProgressSummaryRows(rows)
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
        input.courseId
      )

      await db
        .insert(courseProgress)
        .values({
          userId: input.userId,
          courseId: input.courseId,
          startedAt: currentTime,
          lastLessonId: input.lessonId,
          completedCount,
          updatedAt: currentTime,
        })
        .onConflictDoUpdate({
          target: [courseProgress.userId, courseProgress.courseId],
          set: {
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

async function listActiveCourseLessonIds(
  db: Pick<WritingAppDatabase, "select">,
  courseId: CourseId
) {
  const rows = await db
    .select({ lessonId: courseLessons.lessonId })
    .from(courseChapters)
    .innerJoin(courseLessons, eq(courseLessons.chapterId, courseChapters.id))
    .where(
      and(
        eq(courseChapters.courseId, courseId),
        eq(courseChapters.status, "active"),
        eq(courseLessons.status, "active")
      )
    )
    .orderBy(asc(courseChapters.sortOrder), asc(courseLessons.sortOrder))

  return rows.map((row) => row.lessonId as LessonId)
}

async function countCompletedLessons(
  db: WritingAppDatabase,
  userId: string,
  courseId: string
): Promise<number> {
  const [row] = await db
    .select({ completedCount: count() })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.courseId, courseId),
        eq(lessonProgress.status, "completed")
      )
    )

  return row?.completedCount ?? 0
}

function mapCourseProgress(row: CourseProgressRow) {
  return {
    completedCount: row.completedCount,
    courseId: row.courseId as CourseId,
    lastLessonId: row.lastLessonId ? (row.lastLessonId as LessonId) : undefined,
  }
}

function mapProgressSummaryRows(
  rows: {
    courseDescription: string
    courseId: string
    courseTitle: string
    lessonId: string
    lessonStatus: "completed" | "in-progress" | "not-started" | null
    lessonTitle: string
  }[]
) {
  const summaries = new Map<
    string,
    {
      courseDescription: string
      courseId: CourseId
      courseTitle: string
      lessons: {
        lessonId: LessonId
        progressStatus?: "completed" | "in-progress" | "not-started"
        title: string
      }[]
    }
  >()

  for (const row of rows) {
    const summary = summaries.get(row.courseId) ?? {
      courseDescription: row.courseDescription,
      courseId: row.courseId as CourseId,
      courseTitle: row.courseTitle,
      lessons: [],
    }

    summary.lessons.push({
      lessonId: row.lessonId as LessonId,
      progressStatus: row.lessonStatus ?? undefined,
      title: row.lessonTitle,
    })
    summaries.set(row.courseId, summary)
  }

  return [...summaries.values()]
}

function mapLessonProgress(row: LessonProgressRow): LessonProgressRecord {
  return {
    completedAt: row.completedAt,
    courseId: row.courseId as CourseId,
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

import { and, asc, desc, eq } from "drizzle-orm"
import { createHmac } from "node:crypto"

import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { CourseId, LearnerId, LessonId } from "@workspace/types/ids"

import {
  projectLearnerCourseDetail,
  projectLearnerCoursePage,
  projectLearnerProgressCourse,
  projectLearnerProgressPageWindow,
  type LearnerCourseProjectionBundle,
} from "#learning/application/learner-read-projection"
import type { LearnerCourseDetail } from "#learning/application/learning-read-model"
import {
  readLearnerCourseCursorPrimary,
  resolveLearnerCourseCursorCondition,
  resolveLearnerProgressCursorCondition,
} from "#learning/infrastructure/persistence/learner-cursor"
import { presentLearnerStep } from "#learning/application/learner-step-presenter"
import type {
  LearnerCourseReadQuery,
  LearnerProgressReadQuery,
  LearnerReadModelRepository,
} from "#learning/application/ports/learner-read-model-repository"
import type { LearningContentQueryPort } from "#learning/application/ports/learning-ports"
import type { LearningCurriculum } from "#learning/domain/learning-types"
import {
  learnerCourseProgress,
  learnerLessonProgress,
} from "#learning/infrastructure/persistence/schema"

export function createDrizzleLearningReadRepository(
  database: WritingAppDatabase,
  input: Readonly<{
    content: LearningContentQueryPort
    presentationSecret: string
  }>
): LearnerReadModelRepository {
  return Object.freeze({
    findCourseDetail: (query) =>
      findCourseDetail(database, input.content, query),
    findLesson: (query) =>
      findLesson(database, input.content, input.presentationSecret, query),
    async listCourseCategories() {
      const courses = await input.content.listPublishedCourses()
      return Object.freeze(
        [
          ...new Set(courses.map((course) => course.category.normalize("NFC"))),
        ].sort((left, right) => left.localeCompare(right, "ko"))
      )
    },
    listCourses: (query) => listCourses(input.content, query),
    listProgress: (query) => listProgress(database, input.content, query),
  })
}

async function listCourses(
  content: LearningContentQueryPort,
  query: LearnerCourseReadQuery
) {
  const normalizedCategory = query.category?.normalize("NFC")
  const normalizedQuery = query.query?.normalize("NFC").toLocaleLowerCase("ko")
  const rows = (await content.listPublishedCourses())
    .filter(
      (course) =>
        (normalizedCategory === undefined ||
          course.category.normalize("NFC") === normalizedCategory) &&
        (normalizedQuery === undefined ||
          [course.title, course.description, course.category].some((value) =>
            value
              .normalize("NFC")
              .toLocaleLowerCase("ko")
              .includes(normalizedQuery)
          ))
    )
    .map((course) => ({
      category: course.category,
      contentStatus: "active" as const,
      description: course.description,
      id: course.courseId,
      lessonCount: course.lessonCount,
      revision: course.revision,
      sortOrder: course.sortOrder,
      title: course.title,
      titleSortKey: course.title.normalize("NFC").toLocaleLowerCase("ko"),
      versionId: course.versionId,
      visualKey: course.visualKey,
    }))
    .sort((left, right) => compareCourseRows(left, right, query.sort))
  const cursor = resolveLearnerCourseCursorCondition(query.sort, query.after)
  const afterRows = rows.filter((row) =>
    isCourseAfterCursor(row, cursor, query.sort)
  )

  return projectLearnerCoursePage({
    limit: query.limit,
    nextPrimary: (row) => readLearnerCourseCursorPrimary(row, query.sort),
    rows: afterRows.slice(0, query.limit + 1),
  })
}

async function findCourseDetail(
  database: WritingAppDatabase,
  content: LearningContentQueryPort,
  input: Readonly<{ courseId: CourseId; userId: LearnerId }>
): Promise<LearnerCourseDetail | null> {
  const progress = database
    .select()
    .from(learnerCourseProgress)
    .where(
      and(
        eq(learnerCourseProgress.userId, input.userId),
        eq(learnerCourseProgress.courseId, input.courseId)
      )
    )
    .get()
  const curriculum = await content.readCurriculum({
    courseId: courseIdSchema.parse(input.courseId),
    curriculumVersionId:
      progress === undefined
        ? undefined
        : curriculumVersionIdSchema.parse(progress.curriculumVersionId),
  })

  if (curriculum === null) return null
  return projectCourseDetail(database, curriculum, input.userId, progress)
}

function projectCourseDetail(
  database: WritingAppDatabase,
  curriculum: LearningCurriculum,
  userId: LearnerId,
  courseProgress: typeof learnerCourseProgress.$inferSelect | undefined
): LearnerCourseDetail {
  const activeUnits = curriculum.units
    .filter((unit) => unit.status === "active")
    .sort((left, right) => left.sortOrder - right.sortOrder)
  const activeUnitIds = new Set(activeUnits.map((unit) => unit.id))
  const lessons = curriculum.lessons
    .filter(
      (lesson) => lesson.status === "active" && activeUnitIds.has(lesson.unitId)
    )
    .sort(
      (left, right) =>
        left.unitSortOrder - right.unitSortOrder ||
        left.sortOrder - right.sortOrder ||
        left.id.localeCompare(right.id)
    )
  const progressRows = database
    .select()
    .from(learnerLessonProgress)
    .where(
      and(
        eq(learnerLessonProgress.userId, userId),
        eq(
          learnerLessonProgress.curriculumVersionId,
          curriculum.curriculumVersionId
        )
      )
    )
    .all()
  const bundle: LearnerCourseProjectionBundle = {
    course: {
      contentStatus: curriculum.contentStatus ?? "active",
      id: curriculum.courseId,
    },
    courseProgress:
      courseProgress === undefined
        ? undefined
        : {
            completedAt: courseProgress.completedAt,
            lastActivityAt: courseProgress.lastActivityAt,
            status: courseProgress.status,
          },
    lessonProgress: progressRows.map((row) => ({
      completedAt: row.completedAt,
      currentStepId: lessonStepIdSchema.parse(row.currentStepId),
      lessonId: lessonIdSchema.parse(row.lessonId),
      status: row.status,
      updatedAt: row.updatedAt,
    })),
    lessons: lessons.map((lesson) => ({
      category: lesson.category,
      contentStatus: lesson.status,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      id: lesson.id,
      sortOrder: lesson.sortOrder,
      title: lesson.title,
      unitId: lesson.unitId,
    })),
    steps: lessons.flatMap((lesson) =>
      lesson.steps.map((step) => ({
        id: step.id,
        lessonId: lesson.id,
        sortOrder: step.sortOrder,
      }))
    ),
    units: activeUnits.map((unit) => ({
      id: unit.id,
      sortOrder: unit.sortOrder,
      title: unit.title,
    })),
    version: {
      category: curriculum.category,
      description: curriculum.description,
      id: curriculum.curriculumVersionId,
      revision: curriculum.revision,
      title: curriculum.title,
      visualKey: curriculum.visualKey,
    },
  }

  return projectLearnerCourseDetail(bundle)
}

async function findLesson(
  database: WritingAppDatabase,
  content: LearningContentQueryPort,
  presentationSecret: string,
  input: Readonly<{ lessonId: LessonId; userId: LearnerId }>
) {
  const pinned = database
    .select({
      courseId: learnerLessonProgress.courseId,
      curriculumVersionId: learnerLessonProgress.curriculumVersionId,
    })
    .from(learnerLessonProgress)
    .where(
      and(
        eq(learnerLessonProgress.userId, input.userId),
        eq(learnerLessonProgress.lessonId, input.lessonId)
      )
    )
    .get()
  const curriculum =
    pinned === undefined
      ? await content.findCurriculumByLesson({
          lessonId: lessonIdSchema.parse(input.lessonId),
        })
      : await content.readCurriculum({
          courseId: courseIdSchema.parse(pinned.courseId),
          curriculumVersionId: curriculumVersionIdSchema.parse(
            pinned.curriculumVersionId
          ),
        })
  if (curriculum === null) return { kind: "not-found" as const }

  const courseProgress = database
    .select()
    .from(learnerCourseProgress)
    .where(
      and(
        eq(learnerCourseProgress.userId, input.userId),
        eq(learnerCourseProgress.courseId, curriculum.courseId)
      )
    )
    .get()
  const course = projectCourseDetail(
    database,
    curriculum,
    input.userId,
    courseProgress
  )
  const lessonSummary = course.units
    .flatMap((unit) => unit.lessons)
    .find((lesson) => lesson.id === input.lessonId)
  const lesson = curriculum.lessons.find(
    (candidate) =>
      candidate.id === input.lessonId && candidate.status === "active"
  )
  if (lessonSummary === undefined || lesson === undefined) {
    return { kind: "not-found" as const }
  }
  if (lessonSummary.learning.status === "locked") {
    return { kind: "locked" as const }
  }

  const learnerScope = createHmac("sha256", presentationSecret)
    .update(`presentation:${input.userId}`)
    .digest("base64url")
  const steps = [...lesson.steps]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((step) =>
      presentLearnerStep(step, {
        learnerScope,
        lessonId: lesson.id,
        versionId: curriculum.curriculumVersionId,
      })
    )

  return {
    kind: "found" as const,
    value: {
      category: lesson.category,
      courseId: curriculum.courseId,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      id: lesson.id,
      learning: lessonSummary.learning,
      steps,
      summary: lesson.summary,
      title: lesson.title,
      unitId: lesson.unitId,
      version: course.version,
    },
  }
}

async function listProgress(
  database: WritingAppDatabase,
  content: LearningContentQueryPort,
  query: LearnerProgressReadQuery
) {
  const rows = database
    .select({
      courseId: learnerCourseProgress.courseId,
      lastActivityAt: learnerCourseProgress.lastActivityAt,
    })
    .from(learnerCourseProgress)
    .where(
      and(
        eq(learnerCourseProgress.userId, query.userId),
        query.status === undefined
          ? undefined
          : eq(learnerCourseProgress.status, query.status)
      )
    )
    .orderBy(
      desc(learnerCourseProgress.lastActivityAt),
      asc(learnerCourseProgress.courseId)
    )
    .all()
    .map((row) => ({
      courseId: courseIdSchema.parse(row.courseId),
      lastActivityAt: row.lastActivityAt,
    }))
  const cursor = resolveLearnerProgressCursorCondition(query.after)
  const afterRows = rows.filter((row) => isProgressAfterCursor(row, cursor))
  const { nextPosition, pageRows } = projectLearnerProgressPageWindow(
    afterRows.slice(0, query.limit + 1),
    query.limit
  )
  const items = await Promise.all(
    pageRows.map(async (row) => {
      const course = await findCourseDetail(database, content, {
        courseId: courseIdSchema.parse(row.courseId),
        userId: query.userId,
      })
      if (course === null) {
        throw new Error(`Pinned learner course is missing: ${row.courseId}`)
      }
      return projectLearnerProgressCourse(course)
    })
  )

  return { items, nextPosition }
}

type CourseRow = Readonly<{
  id: CourseId
  lessonCount: number
  sortOrder: number
  titleSortKey: string
}>

function compareCourseRows(
  left: CourseRow,
  right: CourseRow,
  sort: LearnerCourseReadQuery["sort"]
): number {
  const leftPrimary = readLearnerCourseCursorPrimary(left, sort)
  const rightPrimary = readLearnerCourseCursorPrimary(right, sort)
  const descending = sort === "title-desc" || sort === "lesson-count-desc"
  const primary = comparePrimary(leftPrimary, rightPrimary)
  return (descending ? -primary : primary) || left.id.localeCompare(right.id)
}

function isCourseAfterCursor(
  row: CourseRow,
  cursor: ReturnType<typeof resolveLearnerCourseCursorCondition>,
  sort: LearnerCourseReadQuery["sort"]
): boolean {
  if (cursor.kind === "first-page") return true
  if (cursor.kind === "invalid-primary") return false
  const comparison = comparePrimary(
    readLearnerCourseCursorPrimary(row, sort),
    cursor.primary
  )
  return cursor.primaryOrder === "ascending"
    ? comparison > 0 || (comparison === 0 && row.id > cursor.courseId)
    : comparison < 0 || (comparison === 0 && row.id > cursor.courseId)
}

function isProgressAfterCursor(
  row: Readonly<{ courseId: CourseId; lastActivityAt: Date }>,
  cursor: ReturnType<typeof resolveLearnerProgressCursorCondition>
): boolean {
  if (cursor.kind === "first-page") return true
  if (cursor.kind === "invalid-primary") return false
  const primary = row.lastActivityAt.getTime()
  return (
    primary < cursor.primary ||
    (primary === cursor.primary && row.courseId > cursor.courseId)
  )
}

function comparePrimary(left: number | string, right: number | string): number {
  if (typeof left === "number" && typeof right === "number") return left - right
  return String(left).localeCompare(String(right), "ko")
}

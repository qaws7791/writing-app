import { createHmac } from "node:crypto"
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  like,
  or,
  sql,
} from "drizzle-orm"

import type {
  LearnerCourseDetail,
  LearnerCourseSort,
} from "@workspace/contracts/learning/read-data"
import { learnerLessonSchema } from "@workspace/contracts/learning/read-data"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  learnerCourseProgress,
  learnerLessonProgress,
} from "@workspace/db/schema"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/content/schema"

import type {
  LearnerCourseReadQuery,
  LearnerProgressReadQuery,
  LearnerReadModelRepository,
  LearnerCourseProjectionBundle,
} from "@workspace/core/learning"
import {
  presentLearnerStep,
  projectLearnerCourseDetail,
  projectLearnerCoursePage,
  projectLearnerProgressCourse,
  projectLearnerProgressPageWindow,
  resolveLearnerCourseCursorCondition,
  resolveLearnerProgressCursorCondition,
} from "@workspace/core/learning"

import {
  toLearnerCourseCursorPredicate,
  toLearnerProgressCursorPredicate,
} from "@/adapters/learning/learner-read-cursor-drizzle"
import {
  decodeLearnerLessonPersistedData,
  LearnerLessonPersistedDataCorruptionError,
  type LearnerLessonPersistedRowBundle,
} from "@/adapters/learning/learner-read-persisted-data"

const activeStatus = "active" as const

export function createDrizzleLearnerReadModelRepository(
  db: WritingAppDatabase,
  { presentationSecret }: { readonly presentationSecret: string }
): LearnerReadModelRepository {
  return {
    findCourseDetail(input) {
      return Promise.resolve(findCourseDetail(db, input))
    },
    findLesson(input) {
      return Promise.resolve(findLesson(db, input, presentationSecret))
    },
    listCourseCategories() {
      return Promise.resolve(listCourseCategories(db))
    },
    listCourses(query) {
      return Promise.resolve(listCourses(db, query))
    },
    listProgress(query) {
      return Promise.resolve(listProgress(db, query))
    },
  }
}

function createCourseListSubquery(db: WritingAppDatabase) {
  return db
    .select({
      category: courseCurriculumVersions.category,
      contentStatus: courses.status,
      description: courseCurriculumVersions.description,
      id: courses.id,
      lessonCount: count(lessonVersions.id).as("lesson_count"),
      revision: courseCurriculumVersions.revision,
      sortOrder: courses.sortOrder,
      title: courseCurriculumVersions.title,
      titleSortKey:
        sql<string>`lower(${courseCurriculumVersions.title}) COLLATE BINARY`.as(
          "title_sort_key"
        ),
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
    .as("learner_course_list")
}

function listCourses(db: WritingAppDatabase, query: LearnerCourseReadQuery) {
  const courseList = createCourseListSubquery(db)
  const normalizedQuery = query.query?.normalize("NFC").toLowerCase()
  const normalizedCategory = query.category?.normalize("NFC")
  const primary = getCourseSortPrimary(courseList, query.sort)
  const cursorCondition = resolveLearnerCourseCursorCondition(
    query.sort,
    query.after
  )
  const predicates = [
    normalizedCategory === undefined
      ? undefined
      : eq(courseList.category, normalizedCategory),
    normalizedQuery === undefined
      ? undefined
      : or(
          like(sql`lower(${courseList.title})`, `%${normalizedQuery}%`),
          like(sql`lower(${courseList.description})`, `%${normalizedQuery}%`),
          like(sql`lower(${courseList.category})`, `%${normalizedQuery}%`)
        ),
    toLearnerCourseCursorPredicate(
      { courseId: courseList.id, primary },
      cursorCondition
    ),
  ].filter((value) => value !== undefined)
  const rows = db
    .select()
    .from(courseList)
    .where(predicates.length === 0 ? undefined : and(...predicates))
    .orderBy(...getCourseOrder(primary, courseList.id, query.sort))
    .limit(query.limit + 1)
    .all()

  return projectLearnerCoursePage({
    limit: query.limit,
    rows,
    sort: query.sort,
  })
}

function getCourseSortPrimary(
  courseList: ReturnType<typeof createCourseListSubquery>,
  sort: LearnerCourseSort
) {
  switch (sort) {
    case "recommended":
      return courseList.sortOrder
    case "title-asc":
    case "title-desc":
      return courseList.titleSortKey
    case "lesson-count-asc":
    case "lesson-count-desc":
      return courseList.lessonCount
  }
}

function getCourseOrder(
  primary: ReturnType<typeof getCourseSortPrimary>,
  courseId: ReturnType<typeof createCourseListSubquery>["id"],
  sort: LearnerCourseSort
) {
  const primaryOrder =
    sort === "title-desc" || sort === "lesson-count-desc"
      ? desc(primary)
      : asc(primary)
  return [primaryOrder, asc(courseId)] as const
}

function listCourseCategories(db: WritingAppDatabase): readonly string[] {
  return [
    ...new Set(
      db
        .selectDistinct({ category: courseCurriculumVersions.category })
        .from(courses)
        .innerJoin(
          courseCurriculumVersions,
          eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
        )
        .where(eq(courses.status, activeStatus))
        .all()
        .map((row) => row.category.normalize("NFC"))
    ),
  ].sort((left, right) => left.localeCompare(right, "ko"))
}

function findCourseDetail(
  db: WritingAppDatabase,
  { courseId, userId }: { readonly courseId: string; readonly userId: string }
): LearnerCourseDetail | null {
  const bundle = readLearnerCourseProjectionBundle(db, { courseId, userId })

  return bundle === null ? null : projectLearnerCourseDetail(bundle)
}

function readLearnerCourseProjectionBundle(
  db: WritingAppDatabase,
  { courseId, userId }: { readonly courseId: string; readonly userId: string }
): LearnerCourseProjectionBundle | null {
  const course = db.select().from(courses).where(eq(courses.id, courseId)).get()
  if (course === undefined) return null

  const courseProgress = db
    .select()
    .from(learnerCourseProgress)
    .where(
      and(
        eq(learnerCourseProgress.userId, userId),
        eq(learnerCourseProgress.courseId, courseId)
      )
    )
    .get()

  if (courseProgress === undefined && course.status !== activeStatus)
    return null

  const versionId =
    courseProgress?.curriculumVersionId ?? course.publishedCurriculumVersionId
  if (versionId === null) return null

  const version = db
    .select()
    .from(courseCurriculumVersions)
    .where(eq(courseCurriculumVersions.id, versionId))
    .get()
  if (version === undefined) return null

  const units = db
    .select()
    .from(courseUnitVersions)
    .where(
      and(
        eq(courseUnitVersions.curriculumVersionId, versionId),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .orderBy(asc(courseUnitVersions.sortOrder))
    .all()
  const lessons = db
    .select(getTableColumns(lessonVersions))
    .from(lessonVersions)
    .innerJoin(
      courseUnitVersions,
      and(
        eq(
          courseUnitVersions.curriculumVersionId,
          lessonVersions.curriculumVersionId
        ),
        eq(courseUnitVersions.id, lessonVersions.unitId),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, versionId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .orderBy(
      asc(courseUnitVersions.sortOrder),
      asc(lessonVersions.sortOrder),
      asc(lessonVersions.id)
    )
    .all()
  const steps = db
    .select({
      id: lessonStepVersions.id,
      lessonId: lessonStepVersions.lessonId,
      sortOrder: lessonStepVersions.sortOrder,
    })
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, versionId),
        eq(lessonStepVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .all()
  const progressRows = db
    .select()
    .from(learnerLessonProgress)
    .where(
      and(
        eq(learnerLessonProgress.userId, userId),
        eq(learnerLessonProgress.curriculumVersionId, versionId)
      )
    )
    .all()

  return {
    course: {
      contentStatus: course.status,
      id: course.id,
    },
    courseProgress:
      courseProgress === undefined
        ? undefined
        : {
            completedAt: courseProgress.completedAt,
            lastActivityAt: courseProgress.lastActivityAt,
            status: courseProgress.status,
          },
    lessonProgress: progressRows.map((progress) => ({
      completedAt: progress.completedAt,
      currentStepId: progress.currentStepId,
      lessonId: progress.lessonId,
      status: progress.status,
      updatedAt: progress.updatedAt,
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
    steps: steps.map((step) => ({
      id: step.id,
      lessonId: step.lessonId,
      sortOrder: step.sortOrder,
    })),
    units: units.map((unit) => ({
      id: unit.id,
      sortOrder: unit.sortOrder,
      title: unit.title,
    })),
    version: {
      category: version.category,
      description: version.description,
      id: version.id,
      revision: version.revision,
      title: version.title,
      visualKey: version.visualKey,
    },
  }
}

function findLesson(
  db: WritingAppDatabase,
  { lessonId, userId }: { readonly lessonId: string; readonly userId: string },
  presentationSecret: string
) {
  const pinnedCourse = db
    .select({ courseId: learnerCourseProgress.courseId })
    .from(learnerCourseProgress)
    .innerJoin(
      lessonVersions,
      and(
        eq(
          lessonVersions.curriculumVersionId,
          learnerCourseProgress.curriculumVersionId
        ),
        eq(lessonVersions.id, lessonId)
      )
    )
    .where(eq(learnerCourseProgress.userId, userId))
    .get()
  const currentCourse =
    pinnedCourse ??
    db
      .select({ courseId: courses.id })
      .from(courses)
      .innerJoin(
        lessonVersions,
        and(
          eq(
            lessonVersions.curriculumVersionId,
            courses.publishedCurriculumVersionId
          ),
          eq(lessonVersions.id, lessonId)
        )
      )
      .where(eq(courses.status, activeStatus))
      .get()

  if (currentCourse === undefined) return { kind: "not-found" as const }
  const course = findCourseDetail(db, {
    courseId: currentCourse.courseId,
    userId,
  })
  if (course === null) return { kind: "not-found" as const }
  const lessonSummary = course.units
    .flatMap((unit) => unit.lessons)
    .find((lesson) => lesson.id === lessonId)
  if (lessonSummary === undefined) return { kind: "not-found" as const }
  if (lessonSummary.learning.status === "locked") {
    return { kind: "locked" as const }
  }

  const lesson = db
    .select()
    .from(lessonVersions)
    .where(
      and(
        eq(
          lessonVersions.curriculumVersionId,
          course.version.curriculumVersionId
        ),
        eq(lessonVersions.id, lessonId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .get()
  if (lesson === undefined) return { kind: "not-found" as const }

  const learnerScope = createHmac("sha256", presentationSecret)
    .update(`presentation:${userId}`)
    .digest("base64url")
  const persistedData = decodeLearnerLessonPersistedData(
    readLearnerLessonPersistedRowBundle(db, {
      lessonId: lesson.id,
      summaryJson: lesson.summaryJson,
      versionId: course.version.curriculumVersionId,
    })
  )
  if (persistedData.kind === "corrupt") {
    throw new LearnerLessonPersistedDataCorruptionError(
      persistedData.corruption
    )
  }
  const steps = persistedData.value.steps.map((step) =>
    presentLearnerStep(step, {
      learnerScope,
      lessonId,
      versionId: course.version.curriculumVersionId,
    })
  )

  return {
    kind: "found" as const,
    value: learnerLessonSchema.parse({
      category: lesson.category,
      courseId: course.id,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      id: lesson.id,
      learning: lessonSummary.learning,
      steps,
      summary: persistedData.value.summary,
      title: lesson.title,
      unitId: lesson.unitId,
      version: course.version,
    }),
  }
}

function readLearnerLessonPersistedRowBundle(
  db: WritingAppDatabase,
  input: {
    readonly lessonId: string
    readonly summaryJson: string
    readonly versionId: string
  }
): LearnerLessonPersistedRowBundle {
  const stepRows = db
    .select()
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, input.versionId),
        eq(lessonStepVersions.lessonId, input.lessonId),
        eq(lessonStepVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .all()

  return {
    lessonId: input.lessonId,
    stepRows: stepRows.map((row) => ({
      contentJson: row.contentJson,
      id: row.id,
      sortOrder: row.sortOrder,
      type: row.type,
    })),
    summaryJson: input.summaryJson,
  }
}

function listProgress(db: WritingAppDatabase, query: LearnerProgressReadQuery) {
  const cursorCondition = resolveLearnerProgressCursorCondition(query.after)
  const rows = db
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
          : eq(learnerCourseProgress.status, query.status),
        toLearnerProgressCursorPredicate(
          {
            courseId: learnerCourseProgress.courseId,
            primary: learnerCourseProgress.lastActivityAt,
          },
          cursorCondition
        )
      )
    )
    .orderBy(
      desc(learnerCourseProgress.lastActivityAt),
      asc(learnerCourseProgress.courseId)
    )
    .limit(query.limit + 1)
    .all()
  const { nextPosition, pageRows } = projectLearnerProgressPageWindow(
    rows,
    query.limit
  )
  const items = pageRows.map((row) => {
    const course = findCourseDetail(db, {
      courseId: row.courseId,
      userId: query.userId,
    })
    if (course === null) {
      throw new Error(`Pinned learner course is missing: ${row.courseId}`)
    }
    return projectLearnerProgressCourse(course)
  })

  return { items, nextPosition }
}

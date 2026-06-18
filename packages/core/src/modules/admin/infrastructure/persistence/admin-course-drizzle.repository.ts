import type {
  AdminArchiveCourseResultDto,
  AdminContentResetResultDto,
  AdminCourseDetailDto,
  AdminCourseListDto,
  AdminRepository,
  ArchiveAdminCourseInput,
  CreateAdminCourseInput,
  ReadAdminCourseInput,
  ReadAdminCoursesInput,
  ResetAdminContentInput,
} from "@workspace/core/modules/admin/api"
import { contentStatuses } from "@workspace/core/shared/kernel/status"
import { and, asc, count, eq, inArray, or, sql } from "drizzle-orm"

import { archiveContentRowsOutsideSeed } from "@workspace/db/content/content-archive-policy"
import type { KwepDatabase } from "@workspace/db/client"
import {
  createDefaultAdminCourseContentIds,
  type CreateAdminCourseContentIds,
  type NewAdminCourseContentIds,
} from "@workspace/core/modules/admin/infrastructure/persistence/admin-content-ids"
import { createDefaultContentSeedRows } from "@workspace/db/seeds/seed-content"
import {
  courses,
  courseUnits,
  lessons,
  lessonSteps,
} from "@workspace/db/schema"
import { createPageBounds } from "@workspace/core/modules/admin/infrastructure/persistence/admin-repository-shared"

const createCourseCollisionRetryLimit = 3
type LessonRow = typeof lessons.$inferSelect
type LessonStepRow = typeof lessonSteps.$inferSelect
type AdminCourseRepository = Pick<
  AdminRepository,
  | "archiveCourse"
  | "createCourse"
  | "readCourseEditor"
  | "readCourses"
  | "resetContent"
>

export type DrizzleAdminRepositoryDependencies = {
  readonly createCourseContentIds?: CreateAdminCourseContentIds
}

type ResolvedDrizzleAdminRepositoryDependencies = {
  readonly createCourseContentIds: CreateAdminCourseContentIds
}

export function createAdminCourseRepository(
  db: KwepDatabase,
  dependencies: DrizzleAdminRepositoryDependencies = {}
): AdminCourseRepository {
  const resolvedDependencies =
    resolveDrizzleAdminRepositoryDependencies(dependencies)

  return {
    archiveCourse(input) {
      return Promise.resolve(archiveCourse(db, input))
    },
    createCourse(input) {
      return Promise.resolve(
        createCourse(db, input, resolvedDependencies.createCourseContentIds)
      )
    },
    readCourseEditor(input) {
      return Promise.resolve(readCourseEditor(db, input))
    },
    readCourses(input) {
      return Promise.resolve(readCourses(db, input))
    },
    resetContent(input) {
      return resetContent(db, input)
    },
  }
}

function resolveDrizzleAdminRepositoryDependencies(
  dependencies: DrizzleAdminRepositoryDependencies
): ResolvedDrizzleAdminRepositoryDependencies {
  return {
    createCourseContentIds:
      dependencies.createCourseContentIds ?? createDefaultAdminCourseContentIds,
  }
}

function createCourse(
  db: KwepDatabase,
  input: CreateAdminCourseInput,
  createContentIds: CreateAdminCourseContentIds
): AdminCourseDetailDto {
  for (let attempt = 1; attempt <= createCourseCollisionRetryLimit; attempt++) {
    const contentIds = createContentIds()

    try {
      return insertCourseAggregate(db, input, contentIds)
    } catch (error) {
      if (
        attempt === createCourseCollisionRetryLimit ||
        !isContentIdCollision(error)
      ) {
        throw error
      }
    }
  }

  throw new Error("Course content ID generation retry limit was exceeded")
}

function insertCourseAggregate(
  db: KwepDatabase,
  input: CreateAdminCourseInput,
  contentIds: NewAdminCourseContentIds
): AdminCourseDetailDto {
  const { courseId, lessonId, readingStepId, unitId, writeStepId } = contentIds
  const revision = readNextContentRevision(db)
  const sortOrder = readNextCourseSortOrder(db)

  db.transaction((transaction) => {
    transaction
      .insert(courses)
      .values({
        category: "미분류",
        curriculumRevision: revision,
        description: "강의 설명을 입력하세요.",
        id: courseId,
        sortOrder,
        status: contentStatuses.active,
        title: "새 강의",
        visualKey: "basic-sentence-writing",
      })
      .run()
    transaction
      .insert(courseUnits)
      .values({
        courseId,
        id: unitId,
        sortOrder: 1,
        status: contentStatuses.active,
        title: "새 유닛",
      })
      .run()
    transaction
      .insert(lessons)
      .values({
        category: "미분류",
        courseId,
        description: "레슨 설명을 입력하세요.",
        estimatedMinutes: 5,
        id: lessonId,
        sortOrder: 1,
        status: contentStatuses.active,
        summaryJson: "[]",
        title: "새 레슨",
        unitId,
      })
      .run()
    transaction
      .insert(lessonSteps)
      .values([
        {
          contentJson: JSON.stringify({
            body: "본문을 입력하세요.",
            title: "새 읽기 스텝",
            type: "reading",
          }),
          id: readingStepId,
          lessonId,
          sortOrder: 1,
          status: contentStatuses.active,
          type: "READING",
        },
        {
          contentJson: JSON.stringify({
            goal: 150,
            max: 500,
            min: 50,
            prompt: "주제를 입력하세요.",
            title: "글쓰기",
            type: "write",
          }),
          id: writeStepId,
          lessonId,
          sortOrder: 2,
          status: contentStatuses.active,
          type: "WRITE",
        },
      ])
      .run()
  })

  const created = readCourseEditor(db, { courseId })

  if (created === null) {
    throw new Error("Created course editor document was not found")
  }

  return created
}

function isContentIdCollision(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes("UNIQUE constraint failed") &&
    ["courses.id", "course_units.id", "lessons.id", "lesson_steps.id"].some(
      (column) => error.message.includes(column)
    )
  )
}

function readCourseEditor(
  db: KwepDatabase,
  input: ReadAdminCourseInput
): AdminCourseDetailDto | null {
  const course = db
    .select()
    .from(courses)
    .where(eq(courses.id, input.courseId))
    .get()

  if (course === undefined || course.status !== contentStatuses.active) {
    return null
  }

  const unitRows = db
    .select()
    .from(courseUnits)
    .where(
      and(
        eq(courseUnits.courseId, input.courseId),
        eq(courseUnits.status, contentStatuses.active)
      )
    )
    .orderBy(asc(courseUnits.sortOrder))
    .all()
  const unitIds = unitRows.map((unit) => unit.id)
  const lessonRows =
    unitIds.length === 0
      ? []
      : db
          .select()
          .from(lessons)
          .where(
            and(
              eq(lessons.courseId, input.courseId),
              eq(lessons.status, contentStatuses.active),
              inArray(lessons.unitId, unitIds)
            )
          )
          .orderBy(asc(lessons.sortOrder))
          .all()
  const lessonIds = lessonRows.map((lesson) => lesson.id)
  const stepRows =
    lessonIds.length === 0
      ? []
      : db
          .select()
          .from(lessonSteps)
          .where(
            and(
              eq(lessonSteps.status, contentStatuses.active),
              inArray(lessonSteps.lessonId, lessonIds)
            )
          )
          .orderBy(asc(lessonSteps.sortOrder))
          .all()
  const lessonsByUnitId = groupLessonsByUnitId(lessonRows)
  const stepsByLessonId = groupStepsByLessonId(stepRows)

  return {
    category: course.category,
    description: course.description,
    id: course.id,
    revision: course.curriculumRevision,
    status: course.status,
    title: course.title,
    units: unitRows.map((unit) => ({
      id: unit.id,
      lessons:
        lessonsByUnitId.get(unit.id)?.map((lesson) => ({
          category: lesson.category,
          description: lesson.description,
          estimatedMinutes: lesson.estimatedMinutes,
          id: lesson.id,
          sortOrder: lesson.sortOrder,
          status: lesson.status,
          summary: readJsonStringArray(lesson.summaryJson),
          steps:
            stepsByLessonId.get(lesson.id)?.map((step) => ({
              contentJson: step.contentJson,
              id: step.id,
              sortOrder: step.sortOrder,
              status: step.status,
              type: step.type,
            })) ?? [],
          title: lesson.title,
        })) ?? [],
      sortOrder: unit.sortOrder,
      status: unit.status,
      title: unit.title,
    })),
  }
}

function groupLessonsByUnitId(
  lessonRows: readonly LessonRow[]
): Map<string, LessonRow[]> {
  const lessonsByUnitId = new Map<string, LessonRow[]>()

  for (const lesson of lessonRows) {
    const current = lessonsByUnitId.get(lesson.unitId) ?? []

    current.push(lesson)
    lessonsByUnitId.set(lesson.unitId, current)
  }

  return lessonsByUnitId
}

function groupStepsByLessonId(
  stepRows: readonly LessonStepRow[]
): Map<string, LessonStepRow[]> {
  const stepsByLessonId = new Map<string, LessonStepRow[]>()

  for (const step of stepRows) {
    const current = stepsByLessonId.get(step.lessonId) ?? []

    current.push(step)
    stepsByLessonId.set(step.lessonId, current)
  }

  return stepsByLessonId
}

function readJsonStringArray(value: string): string[] {
  const parsed: unknown = JSON.parse(value)

  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : []
}

function readCourses(
  db: KwepDatabase,
  input: ReadAdminCoursesInput
): AdminCourseListDto {
  const query = input.query.trim().toLowerCase()
  const category = input.category.trim()
  const activeUnitCountExpression = sql<number>`count(distinct case when ${courseUnits.status} = ${contentStatuses.active} then ${courseUnits.id} end)`
  const activeLessonCountExpression = sql<number>`count(distinct case when ${courseUnits.status} = ${contentStatuses.active} and ${lessons.status} = ${contentStatuses.active} then ${lessons.id} end)`
  const whereCondition = createReadCoursesWhereCondition({
    category,
    query,
    status: input.status,
  })
  const totalItems =
    db.select({ value: count() }).from(courses).where(whereCondition).get()
      ?.value ?? 0
  const pagination = createPageBounds(input, totalItems)
  const rows = db
    .select({
      category: courses.category,
      id: courses.id,
      lessonCount: activeLessonCountExpression,
      revision: courses.curriculumRevision,
      status: courses.status,
      title: courses.title,
      unitCount: activeUnitCountExpression,
    })
    .from(courses)
    .leftJoin(courseUnits, eq(courseUnits.courseId, courses.id))
    .leftJoin(
      lessons,
      and(eq(lessons.courseId, courses.id), eq(lessons.unitId, courseUnits.id))
    )
    .where(whereCondition)
    .groupBy(
      courses.id,
      courses.category,
      courses.curriculumRevision,
      courses.status,
      courses.title,
      courses.sortOrder
    )
    .orderBy(asc(courses.sortOrder))
    .limit(pagination.pageSize)
    .offset(pagination.offset)
    .all()

  return {
    items: rows,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
    },
  }
}

function createReadCoursesWhereCondition({
  category,
  query,
  status,
}: {
  readonly category: string
  readonly query: string
  readonly status: ReadAdminCoursesInput["status"]
}) {
  const statusCondition =
    status === "all" ? undefined : eq(courses.status, status)
  const categoryCondition =
    category.length === 0 ? undefined : eq(courses.category, category)
  const queryCondition =
    query.length === 0
      ? undefined
      : or(
          sql`lower(${courses.title}) like ${`%${query}%`}`,
          sql`lower(${courses.description}) like ${`%${query}%`}`
        )

  return and(statusCondition, categoryCondition, queryCondition)
}

function archiveCourse(
  db: KwepDatabase,
  input: ArchiveAdminCourseInput
): AdminArchiveCourseResultDto | null {
  const course = db
    .select()
    .from(courses)
    .where(eq(courses.id, input.courseId))
    .get()

  if (course === undefined || course.status === contentStatuses.archived) {
    return null
  }

  void input.now

  db.update(courses)
    .set({
      status: contentStatuses.archived,
    })
    .where(eq(courses.id, input.courseId))
    .run()

  return { archived: true }
}

function readNextCourseSortOrder(db: KwepDatabase): number {
  const sortOrders = db
    .select()
    .from(courses)
    .all()
    .map((course) => course.sortOrder)

  return Math.max(0, ...sortOrders) + 1
}

async function resetContent(
  db: KwepDatabase,
  input: ResetAdminContentInput
): Promise<AdminContentResetResultDto> {
  const seedRows = await createDefaultContentSeedRows()
  const revision = readNextContentRevision(db)

  return db.transaction((transaction) => {
    void input.now

    const archived = archiveContentRowsOutsideSeed(transaction, seedRows)

    for (const course of seedRows.courses) {
      transaction
        .insert(courses)
        .values({
          ...course,
          curriculumRevision: revision,
        })
        .onConflictDoUpdate({
          set: {
            category: course.category,
            curriculumRevision: revision,
            description: course.description,
            sortOrder: course.sortOrder,
            status: contentStatuses.active,
            title: course.title,
          },
          target: courses.id,
        })
        .run()
    }
    for (const unit of seedRows.units) {
      transaction
        .insert(courseUnits)
        .values(unit)
        .onConflictDoUpdate({
          set: {
            courseId: unit.courseId,
            sortOrder: unit.sortOrder,
            status: contentStatuses.active,
            title: unit.title,
          },
          target: courseUnits.id,
        })
        .run()
    }
    for (const lesson of seedRows.lessons) {
      transaction
        .insert(lessons)
        .values(lesson)
        .onConflictDoUpdate({
          set: {
            category: lesson.category,
            courseId: lesson.courseId,
            description: lesson.description,
            estimatedMinutes: lesson.estimatedMinutes,
            sortOrder: lesson.sortOrder,
            status: contentStatuses.active,
            summaryJson: lesson.summaryJson,
            title: lesson.title,
            unitId: lesson.unitId,
          },
          target: lessons.id,
        })
        .run()
    }
    for (const step of seedRows.steps) {
      transaction
        .insert(lessonSteps)
        .values(step)
        .onConflictDoUpdate({
          set: {
            contentJson: step.contentJson,
            lessonId: step.lessonId,
            sortOrder: step.sortOrder,
            status: contentStatuses.active,
            type: step.type,
          },
          target: lessonSteps.id,
        })
        .run()
    }

    return {
      changed: {
        archived,
        courses: seedRows.courses.length,
        lessons: seedRows.lessons.length,
        steps: seedRows.steps.length,
        units: seedRows.units.length,
      },
      revision,
    }
  })
}

function readNextContentRevision(db: KwepDatabase): number {
  const revision =
    db
      .select({
        value: sql<number>`coalesce(max(${courses.curriculumRevision}), 0)`,
      })
      .from(courses)
      .get()?.value ?? 0

  return revision + 1
}

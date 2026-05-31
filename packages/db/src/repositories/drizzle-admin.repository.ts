import {
  and,
  asc,
  count,
  eq,
  inArray,
  like,
  notInArray,
  or,
  sql,
} from "drizzle-orm"

import {
  adminEditorStepDetailDtoSchema,
  type AdminCourseEditorDetailDto,
  type AdminEditorCurriculumDetailDto,
  type AdminEditorLessonDetailDto,
  type AdminEditorStepDetailDto,
  type AdminEditorStepSummaryDto,
  type AdminRepository,
  type AdminSaveCurriculumContentRequestDto,
} from "@workspace/core/admin"

import type { WritingAppDatabase } from "../client"
import {
  courseChapters,
  courseLessons,
  courses,
  lessons,
  lessonSteps,
  user,
} from "../schema"

type CourseChapterRow = typeof courseChapters.$inferSelect
type CourseLessonRow = typeof courseLessons.$inferSelect
type LessonRow = typeof lessons.$inferSelect
type LessonStepRow = typeof lessonSteps.$inferSelect

type AdminEditorTransaction = Pick<
  WritingAppDatabase,
  "delete" | "insert" | "select" | "update"
>

export function createDrizzleAdminRepository(
  db: WritingAppDatabase
): AdminRepository {
  return {
    async getCourseDetail(courseId) {
      const [course] = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          sortOrder: courses.sortOrder,
        })
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1)

      return course
    },

    async getCourseEditorDocument(courseId) {
      const [course] = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          sortOrder: courses.sortOrder,
          revision: courses.curriculumRevision,
        })
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1)

      if (!course) {
        return undefined
      }

      const curriculum = await getEditorCurriculum(db, courseId)

      return {
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          sortOrder: course.sortOrder,
        },
        revision: course.revision,
        curriculum,
      } satisfies AdminCourseEditorDetailDto
    },

    async listCourses(input) {
      const trimmedQuery = input.query.trim()
      const searchCondition =
        trimmedQuery.length > 0
          ? or(
              like(courses.title, `%${trimmedQuery}%`),
              like(courses.description, `%${trimmedQuery}%`)
            )
          : undefined
      const offset = (input.page - 1) * input.pageSize

      const [courseRows, totalRows] = await Promise.all([
        db
          .select({
            id: courses.id,
            title: courses.title,
            description: courses.description,
            sortOrder: courses.sortOrder,
          })
          .from(courses)
          .where(searchCondition)
          .orderBy(asc(courses.sortOrder))
          .limit(input.pageSize)
          .offset(offset),
        db.select({ value: count() }).from(courses).where(searchCondition),
      ])
      const totalCount = totalRows[0]?.value ?? 0

      return {
        courses: courseRows,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / input.pageSize)),
        },
        query: trimmedQuery,
      }
    },

    async listCourseTree() {
      const [courseRows, chapterRows, lessonRows] = await Promise.all([
        db.select().from(courses).orderBy(asc(courses.sortOrder)),
        db.select().from(courseChapters).orderBy(asc(courseChapters.sortOrder)),
        db.select().from(courseLessons).orderBy(asc(courseLessons.sortOrder)),
      ])

      return {
        courses: courseRows.map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          sortOrder: course.sortOrder,
          chapters: chapterRows
            .filter((chapter) => chapter.courseId === course.id)
            .map((chapter) => ({
              id: chapter.id,
              title: chapter.title,
              sortOrder: chapter.sortOrder,
              status: chapter.status,
              lessons: lessonRows
                .filter((lesson) => lesson.chapterId === chapter.id)
                .map((lesson) => ({
                  id: lesson.id,
                  lessonId: lesson.lessonId,
                  title: lesson.title,
                  description: lesson.description,
                  sortOrder: lesson.sortOrder,
                  status: lesson.status,
                })),
            })),
        })),
      }
    },

    async getCourseLessonDetail(courseId, lessonId) {
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)))
        .limit(1)

      if (!lesson) {
        return undefined
      }

      const stepRows = await db
        .select()
        .from(lessonSteps)
        .where(eq(lessonSteps.lessonId, lesson.id))
        .orderBy(asc(lessonSteps.sortOrder))

      return mapEditorLessonDetail(lesson, stepRows)
    },

    async saveCurriculumContent(input) {
      return db.transaction(async (tx) => saveCurrentCurriculum(tx, input))
    },

    async saveCourseEditorDocument(input) {
      return db.transaction(async (tx) => saveCurrentCurriculum(tx, input))
    },

    async listUsers() {
      const userRows = await db.select().from(user).orderBy(asc(user.createdAt))

      return {
        users: userRows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          emailVerified: row.emailVerified,
          image: row.image,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      }
    },
  }
}

async function getEditorCurriculum(
  db: Pick<WritingAppDatabase, "select">,
  courseId: string
): Promise<AdminEditorCurriculumDetailDto> {
  const chapterRows = await db
    .select()
    .from(courseChapters)
    .where(eq(courseChapters.courseId, courseId))
    .orderBy(asc(courseChapters.sortOrder))
  const lessonRows =
    chapterRows.length === 0
      ? []
      : await db
          .select()
          .from(courseLessons)
          .where(
            inArray(
              courseLessons.chapterId,
              chapterRows.map((chapter) => chapter.id)
            )
          )
          .orderBy(asc(courseLessons.sortOrder))
  const stepRows =
    lessonRows.length === 0
      ? []
      : await db
          .select()
          .from(lessonSteps)
          .where(
            inArray(
              lessonSteps.lessonId,
              lessonRows.map((lesson) => lesson.lessonId)
            )
          )
          .orderBy(asc(lessonSteps.lessonId), asc(lessonSteps.sortOrder))

  return mapEditorCurriculumDetail(chapterRows, lessonRows, stepRows)
}

async function saveCurrentCurriculum(
  tx: AdminEditorTransaction,
  input: AdminSaveCurriculumContentRequestDto
) {
  const [course] = await tx
    .select({ categoryId: courses.categoryId })
    .from(courses)
    .where(eq(courses.id, input.courseId))
    .limit(1)

  if (!course) {
    return {
      status: "not-found",
      error: {
        code: "not-found",
        message: "코스를 찾을 수 없습니다.",
      },
    } as const
  }

  const [updatedCourse] = await tx
    .update(courses)
    .set({
      title: input.course.title,
      description: input.course.description,
      sortOrder: input.course.sortOrder,
      curriculumRevision: sql`${courses.curriculumRevision} + 1`,
    })
    .where(
      and(
        eq(courses.id, input.courseId),
        eq(courses.curriculumRevision, input.expectedRevision)
      )
    )
    .returning({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      sortOrder: courses.sortOrder,
      revision: courses.curriculumRevision,
    })

  if (!updatedCourse) {
    return {
      status: "conflict",
      error: {
        code: "conflict",
        message: "다른 관리자가 먼저 저장했습니다.",
      },
    } as const
  }

  await ensureEditorLessons(tx, input, course.categoryId)

  const existingChapters = await tx
    .select({ id: courseChapters.id })
    .from(courseChapters)
    .where(eq(courseChapters.courseId, input.courseId))
  const existingChapterIds = existingChapters.map((chapter) => chapter.id)
  const inputChapterIds = input.chapters.map((chapter) => chapter.id)
  const omittedChapterIds = existingChapterIds.filter(
    (chapterId) => !inputChapterIds.includes(chapterId)
  )

  const existingLessons =
    existingChapterIds.length === 0
      ? []
      : await tx
          .select({ id: courseLessons.id })
          .from(courseLessons)
          .where(inArray(courseLessons.chapterId, existingChapterIds))
  const existingLessonIds = existingLessons.map((lesson) => lesson.id)
  const inputCourseLessonIds = input.lessons.map((lesson) => lesson.id)
  const omittedCourseLessonIds = existingLessonIds.filter(
    (lessonId) => !inputCourseLessonIds.includes(lessonId)
  )

  if (omittedCourseLessonIds.length > 0) {
    await tx
      .update(courseLessons)
      .set({ status: "archived" })
      .where(inArray(courseLessons.id, omittedCourseLessonIds))
  }

  if (omittedChapterIds.length > 0) {
    await tx
      .update(courseChapters)
      .set({ status: "archived" })
      .where(inArray(courseChapters.id, omittedChapterIds))
  }

  if (input.chapters.length > 0) {
    await tx
      .insert(courseChapters)
      .values(
        input.chapters.map((chapter) => ({
          id: chapter.id,
          courseId: input.courseId,
          title: chapter.title,
          sortOrder: chapter.sortOrder,
          status: chapter.status,
        }))
      )
      .onConflictDoUpdate({
        target: courseChapters.id,
        set: {
          title: sql`excluded.title`,
          sortOrder: sql`excluded.sort_order`,
          status: sql`excluded.status`,
        },
      })
  }

  if (input.lessons.length > 0) {
    await tx
      .insert(courseLessons)
      .values(
        input.lessons.map((lesson) => ({
          id: lesson.id,
          chapterId: lesson.chapterId,
          lessonId: lesson.lessonId,
          title: lesson.title,
          description: lesson.description,
          sortOrder: lesson.sortOrder,
          status: lesson.status,
        }))
      )
      .onConflictDoUpdate({
        target: courseLessons.id,
        set: {
          chapterId: sql`excluded.chapter_id`,
          lessonId: sql`excluded.lesson_id`,
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          sortOrder: sql`excluded.sort_order`,
          status: sql`excluded.status`,
        },
      })
  }

  await markMissingStepsArchived(tx, input)

  if (input.steps.length > 0) {
    await tx
      .insert(lessonSteps)
      .values(
        input.steps.map((step) => ({
          id: step.id,
          lessonId: step.lessonId,
          type: step.type,
          sortOrder: step.sortOrder,
          points: step.points,
          required: step.required,
          status: step.status,
          contentJson: JSON.stringify(step.content),
        }))
      )
      .onConflictDoUpdate({
        target: lessonSteps.id,
        set: {
          type: sql`excluded.type`,
          sortOrder: sql`excluded.sort_order`,
          points: sql`excluded.points`,
          required: sql`excluded.required`,
          status: sql`excluded.status`,
          contentJson: sql`excluded.content_json`,
        },
      })
  }

  return {
    status: "saved",
    document: {
      course: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        sortOrder: updatedCourse.sortOrder,
      },
      revision: updatedCourse.revision,
      curriculum: {
        chapters: input.chapters.map((chapter) => ({
          ...chapter,
          lessons: input.lessons
            .filter((lesson) => lesson.chapterId === chapter.id)
            .map(({ chapterId: _chapterId, ...lesson }) => lesson),
        })),
        steps: input.steps,
      },
    },
  } as const
}

async function ensureEditorLessons(
  tx: AdminEditorTransaction,
  input: AdminSaveCurriculumContentRequestDto,
  categoryId: string
) {
  if (input.lessons.length === 0) {
    return
  }

  const flatLessons = input.lessons
  const existingLessons = await tx
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.courseId, input.courseId))
  const existingLessonIds = new Set(existingLessons.map((lesson) => lesson.id))

  for (const [index, lesson] of flatLessons.entries()) {
    const nextLesson = flatLessons[index + 1]

    if (existingLessonIds.has(lesson.lessonId)) {
      await tx
        .update(lessons)
        .set({
          title: lesson.title,
          unitNumber: lesson.sortOrder,
          nextLessonId: nextLesson?.lessonId ?? null,
        })
        .where(eq(lessons.id, lesson.lessonId))
      continue
    }

    await tx.insert(lessons).values({
      id: lesson.lessonId,
      courseId: input.courseId,
      title: lesson.title,
      categoryId,
      unitNumber: lesson.sortOrder,
      nextLessonId: nextLesson?.lessonId ?? null,
    })
  }
}

async function markMissingStepsArchived(
  tx: AdminEditorTransaction,
  input: AdminSaveCurriculumContentRequestDto
) {
  const lessonIds = [...new Set(input.lessons.map((lesson) => lesson.lessonId))]
  const stepIds = input.steps.map((step) => step.id)

  if (lessonIds.length === 0) {
    return
  }

  const condition =
    stepIds.length > 0
      ? and(
          inArray(lessonSteps.lessonId, lessonIds),
          notInArray(lessonSteps.id, stepIds)
        )
      : inArray(lessonSteps.lessonId, lessonIds)

  await tx.update(lessonSteps).set({ status: "archived" }).where(condition)
}

function mapEditorCurriculumDetail(
  chapters: CourseChapterRow[],
  lessons: CourseLessonRow[],
  steps: LessonStepRow[]
): AdminEditorCurriculumDetailDto {
  return {
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      sortOrder: chapter.sortOrder,
      status: chapter.status,
      lessons: lessons
        .filter((lesson) => lesson.chapterId === chapter.id)
        .map((lesson) => ({
          id: lesson.id,
          lessonId: lesson.lessonId,
          title: lesson.title,
          description: lesson.description,
          sortOrder: lesson.sortOrder,
          status: lesson.status,
        })),
    })),
    steps: steps.map(mapEditorStepDetail),
  }
}

function mapEditorLessonDetail(
  lesson: LessonRow,
  steps: LessonStepRow[]
): AdminEditorLessonDetailDto {
  return {
    id: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    categoryId: lesson.categoryId,
    unitNumber: lesson.unitNumber,
    nextLessonId: lesson.nextLessonId,
    steps: steps.map(mapEditorStepDetail),
  }
}

function mapEditorStepDetail(step: LessonStepRow): AdminEditorStepDetailDto {
  return adminEditorStepDetailDtoSchema.parse({
    ...mapEditorStepSummary(step),
    content: JSON.parse(step.contentJson) as unknown,
  })
}

function mapEditorStepSummary(step: LessonStepRow): AdminEditorStepSummaryDto {
  return {
    id: step.id,
    lessonId: step.lessonId,
    type: step.type,
    title: getStepDisplayTitle(step),
    sortOrder: step.sortOrder,
    points: step.points,
    required: step.required,
    status: step.status,
  }
}

function getStepDisplayTitle(step: LessonStepRow) {
  try {
    const content = JSON.parse(step.contentJson) as unknown

    if (
      typeof content === "object" &&
      content !== null &&
      "title" in content &&
      typeof content.title === "string" &&
      content.title.trim().length > 0
    ) {
      return content.title
    }
  } catch {
    return step.type
  }

  return step.type
}

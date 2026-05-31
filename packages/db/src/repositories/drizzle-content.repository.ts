import { and, asc, count, eq, inArray } from "drizzle-orm"

import type {
  ContentRepository,
  CourseCategoryListDto,
  CourseDetailDto,
  RawContentRepositoryLesson,
  RawContentRepositoryLessonStep,
} from "@workspace/core/content"

import type { WritingAppDatabase } from "../client"
import {
  courseCategories,
  courseChapters,
  courseLessons,
  courses,
  lessons,
  lessonSteps,
} from "../schema"

type CourseLessonRow = typeof courseLessons.$inferSelect
type LessonStepRow = typeof lessonSteps.$inferSelect

export function createDrizzleContentRepository(
  db: WritingAppDatabase
): ContentRepository {
  return {
    async listCourseCategories() {
      const [categoryRows, courseRows, lessonCountsByCourseId] =
        await Promise.all([
          db
            .select()
            .from(courseCategories)
            .orderBy(asc(courseCategories.sortOrder)),
          db.select().from(courses).orderBy(asc(courses.sortOrder)),
          countLessonsByCourseId(db),
        ])

      return {
        categories: categoryRows.map((category) => ({
          id: category.id,
          title: category.title,
          courses: courseRows
            .filter((course) => course.categoryId === category.id)
            .map((course) => ({
              id: course.id,
              title: course.title,
              description: course.description,
              lessonCount: lessonCountsByCourseId.get(course.id) ?? 0,
            })),
        })),
      } satisfies CourseCategoryListDto
    },

    async findCourseDetail(courseId) {
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1)

      if (!course) {
        return undefined
      }

      const chapterRows = await db
        .select()
        .from(courseChapters)
        .where(
          and(
            eq(courseChapters.courseId, courseId),
            eq(courseChapters.status, "active")
          )
        )
        .orderBy(asc(courseChapters.sortOrder))

      const lessonRows = await listCourseLessons(
        db,
        chapterRows.map(({ id }) => id)
      )
      const firstLessonId = chapterRows
        .flatMap((chapter) =>
          lessonRows.filter((lesson) => lesson.chapterId === chapter.id)
        )
        .at(0)?.lessonId

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        lessonCount: lessonRows.length,
        firstLessonId,
        chapters: chapterRows.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          lessons: lessonRows
            .filter((lesson) => lesson.chapterId === chapter.id)
            .map(mapCourseLesson),
        })),
      } satisfies CourseDetailDto
    },

    async findLesson(lessonId) {
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .limit(1)

      if (!lesson) {
        return undefined
      }

      const stepRows = await db
        .select()
        .from(lessonSteps)
        .where(
          and(
            eq(lessonSteps.lessonId, lessonId),
            eq(lessonSteps.status, "active")
          )
        )
        .orderBy(asc(lessonSteps.sortOrder))

      return {
        id: lesson.id,
        title: lesson.title,
        categoryId: lesson.categoryId,
        courseId: lesson.courseId,
        unitNumber: lesson.unitNumber,
        nextLessonId: lesson.nextLessonId ?? undefined,
        steps: stepRows.map(mapLessonStep),
      } satisfies RawContentRepositoryLesson
    },
  }
}

async function listCourseLessons(
  db: WritingAppDatabase,
  chapterIds: string[]
): Promise<CourseLessonRow[]> {
  if (chapterIds.length === 0) {
    return []
  }

  return db
    .select()
    .from(courseLessons)
    .where(
      and(
        inArray(courseLessons.chapterId, chapterIds),
        eq(courseLessons.status, "active")
      )
    )
    .orderBy(asc(courseLessons.sortOrder))
}

async function countLessonsByCourseId(db: WritingAppDatabase) {
  const lessonCountRows = await db
    .select({
      courseId: courseChapters.courseId,
      lessonCount: count(courseLessons.id),
    })
    .from(courseChapters)
    .innerJoin(courseLessons, eq(courseLessons.chapterId, courseChapters.id))
    .where(
      and(
        eq(courseChapters.status, "active"),
        eq(courseLessons.status, "active")
      )
    )
    .groupBy(courseChapters.courseId)

  return new Map(lessonCountRows.map((row) => [row.courseId, row.lessonCount]))
}

function mapCourseLesson(lesson: CourseLessonRow) {
  return {
    id: lesson.id,
    lessonId: lesson.lessonId,
    title: lesson.title,
    description: lesson.description,
    order: lesson.sortOrder,
  }
}

function mapLessonStep(step: LessonStepRow): RawContentRepositoryLessonStep {
  return {
    id: step.id,
    type: step.type,
    order: step.sortOrder,
    points: step.points,
    required: step.required,
    content: parseContentJson(step.contentJson),
  }
}

function parseContentJson(contentJson: string): unknown {
  try {
    return JSON.parse(contentJson)
  } catch {
    return null
  }
}

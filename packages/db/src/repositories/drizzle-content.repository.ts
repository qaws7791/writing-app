import { asc, count, eq, inArray, like, or } from "drizzle-orm"

import type {
  ContentRepository,
  ContentRepositoryLessonDto,
  ContentRepositoryLessonStepDto,
  CourseCategoryListDto,
  CourseDetailDto,
} from "@workspace/core/content"

import type { WritingAppDatabase } from "@/client"
import {
  courseCategories,
  courseChapters,
  courseLessons,
  courses,
  lessons,
  lessonSteps,
} from "@/schema"

type CourseLessonRow = typeof courseLessons.$inferSelect
type LessonStepRow = typeof lessonSteps.$inferSelect

export function createDrizzleContentRepository(
  db: WritingAppDatabase
): ContentRepository {
  return {
    async listCourseCategories() {
      const [categoryRows, courseRows, lessonCountRows] = await Promise.all([
        db
          .select()
          .from(courseCategories)
          .orderBy(asc(courseCategories.sortOrder)),
        db.select().from(courses).orderBy(asc(courses.sortOrder)),
        db
          .select({
            courseId: courseChapters.courseId,
            lessonCount: count(courseLessons.id),
          })
          .from(courseChapters)
          .leftJoin(
            courseLessons,
            eq(courseLessons.chapterId, courseChapters.id)
          )
          .groupBy(courseChapters.courseId),
      ])

      const lessonCountsByCourseId = new Map(
        lessonCountRows.map((row) => [row.courseId, row.lessonCount])
      )

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
              thumbnail: course.thumbnailPath,
            })),
        })),
      } satisfies CourseCategoryListDto
    },

    async searchCourses(query) {
      const courseRows = await db
        .select()
        .from(courses)
        .where(
          or(
            like(courses.title, `%${query}%`),
            like(courses.description, `%${query}%`)
          )
        )
        .orderBy(asc(courses.sortOrder))
      const lessonCountsByCourseId = await countLessonsByCourseId(db)

      return {
        courses: courseRows.map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          lessonCount: lessonCountsByCourseId.get(course.id) ?? 0,
          thumbnail: course.thumbnailPath,
        })),
      }
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
        .where(eq(courseChapters.courseId, courseId))
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
        thumbnail: course.thumbnailPath,
        lessonCount: lessonRows.length,
        firstLessonId,
        chapters: chapterRows.map((chapter) => ({
          id: chapter.id,
          label: chapter.label,
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
        .where(eq(lessonSteps.lessonId, lessonId))
        .orderBy(asc(lessonSteps.sortOrder))

      return {
        id: lesson.id,
        title: lesson.title,
        categoryId: lesson.categoryId,
        courseId: lesson.courseId,
        unitNumber: lesson.unitNumber,
        nextLessonId: lesson.nextLessonId ?? undefined,
        steps: stepRows.map(mapLessonStep),
      } satisfies ContentRepositoryLessonDto
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
    .where(inArray(courseLessons.chapterId, chapterIds))
    .orderBy(asc(courseLessons.sortOrder))
}

async function countLessonsByCourseId(db: WritingAppDatabase) {
  const lessonCountRows = await db
    .select({
      courseId: courseChapters.courseId,
      lessonCount: count(courseLessons.id),
    })
    .from(courseChapters)
    .leftJoin(courseLessons, eq(courseLessons.chapterId, courseChapters.id))
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

function mapLessonStep(step: LessonStepRow): ContentRepositoryLessonStepDto {
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

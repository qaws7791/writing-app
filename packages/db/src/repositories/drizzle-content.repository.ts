import { and, asc, count, desc, eq, inArray, like, or } from "drizzle-orm"

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
  courses,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  lessons,
  lessonSteps,
} from "@/schema"

type CourseLessonRow = typeof curriculumVersionLessons.$inferSelect
type CurriculumVersionRow = typeof curriculumVersions.$inferSelect
type LessonStepRow = typeof lessonSteps.$inferSelect

export function createDrizzleContentRepository(
  db: WritingAppDatabase
): ContentRepository {
  return {
    async listCourseCategories() {
      const [categoryRows, courseRows, latestVersionsByCourseId] =
        await Promise.all([
          db
            .select()
            .from(courseCategories)
            .orderBy(asc(courseCategories.sortOrder)),
          db.select().from(courses).orderBy(asc(courses.sortOrder)),
          listLatestPublishedVersionsByCourseId(db),
        ])
      const lessonCountsByVersionId = await countLessonsByCurriculumVersionId(
        db,
        [...latestVersionsByCourseId.values()].map((version) => version.id)
      )

      return {
        categories: categoryRows.map((category) => ({
          id: category.id,
          title: category.title,
          courses: courseRows
            .filter((course) => course.categoryId === category.id)
            .flatMap((course) => {
              const version = latestVersionsByCourseId.get(course.id)

              if (!version) {
                return []
              }

              return [
                {
                  id: course.id,
                  title: course.title,
                  description: course.description,
                  lessonCount: lessonCountsByVersionId.get(version.id) ?? 0,
                  thumbnail: course.thumbnailPath,
                },
              ]
            }),
        })),
      } satisfies CourseCategoryListDto
    },

    async searchCourses(query) {
      const [courseRows, latestVersionsByCourseId] = await Promise.all([
        db
          .select()
          .from(courses)
          .where(
            or(
              like(courses.title, `%${query}%`),
              like(courses.description, `%${query}%`)
            )
          )
          .orderBy(asc(courses.sortOrder)),
        listLatestPublishedVersionsByCourseId(db),
      ])
      const lessonCountsByVersionId = await countLessonsByCurriculumVersionId(
        db,
        [...latestVersionsByCourseId.values()].map((version) => version.id)
      )

      return {
        courses: courseRows.flatMap((course) => {
          const version = latestVersionsByCourseId.get(course.id)

          if (!version) {
            return []
          }

          return [
            {
              id: course.id,
              title: course.title,
              description: course.description,
              lessonCount: lessonCountsByVersionId.get(version.id) ?? 0,
              thumbnail: course.thumbnailPath,
            },
          ]
        }),
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

      const curriculumVersion = await findLatestPublishedVersion(db, courseId)

      if (!curriculumVersion) {
        return undefined
      }

      const chapterRows = await db
        .select()
        .from(curriculumVersionChapters)
        .where(
          and(
            eq(
              curriculumVersionChapters.curriculumVersionId,
              curriculumVersion.id
            ),
            eq(curriculumVersionChapters.status, "active")
          )
        )
        .orderBy(asc(curriculumVersionChapters.sortOrder))

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
    .from(curriculumVersionLessons)
    .where(
      and(
        inArray(curriculumVersionLessons.chapterId, chapterIds),
        eq(curriculumVersionLessons.status, "active")
      )
    )
    .orderBy(asc(curriculumVersionLessons.sortOrder))
}

async function listLatestPublishedVersionsByCourseId(db: WritingAppDatabase) {
  const versionRows = await db
    .select()
    .from(curriculumVersions)
    .where(eq(curriculumVersions.status, "published"))
    .orderBy(
      asc(curriculumVersions.courseId),
      asc(curriculumVersions.versionNumber)
    )

  return versionRows.reduce((versionsByCourseId, version) => {
    versionsByCourseId.set(version.courseId, version)

    return versionsByCourseId
  }, new Map<string, CurriculumVersionRow>())
}

async function findLatestPublishedVersion(
  db: WritingAppDatabase,
  courseId: string
) {
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

  return version
}

async function countLessonsByCurriculumVersionId(
  db: WritingAppDatabase,
  curriculumVersionIds: string[]
) {
  if (curriculumVersionIds.length === 0) {
    return new Map<string, number>()
  }

  const lessonCountRows = await db
    .select({
      curriculumVersionId: curriculumVersionChapters.curriculumVersionId,
      lessonCount: count(curriculumVersionLessons.id),
    })
    .from(curriculumVersionChapters)
    .innerJoin(
      curriculumVersionLessons,
      eq(curriculumVersionLessons.chapterId, curriculumVersionChapters.id)
    )
    .where(
      and(
        inArray(
          curriculumVersionChapters.curriculumVersionId,
          curriculumVersionIds
        ),
        eq(curriculumVersionChapters.status, "active"),
        eq(curriculumVersionLessons.status, "active")
      )
    )
    .groupBy(curriculumVersionChapters.curriculumVersionId)

  return new Map(
    lessonCountRows.map((row) => [row.curriculumVersionId, row.lessonCount])
  )
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

import { asc, count, eq, inArray, like, or } from "drizzle-orm"

import type { AdminRepository } from "@workspace/core/admin"

import type { WritingAppDatabase } from "@/client"
import {
  courses,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  user,
} from "@/schema"

type CurriculumVersionRow = typeof curriculumVersions.$inferSelect

export function createDrizzleAdminRepository(
  db: WritingAppDatabase
): AdminRepository {
  return {
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
            thumbnailPath: courses.thumbnailPath,
            sortOrder: courses.sortOrder,
          })
          .from(courses)
          .where(searchCondition)
          .orderBy(asc(courses.sortOrder))
          .limit(input.pageSize)
          .offset(offset),
        db
          .select({
            value: count(),
          })
          .from(courses)
          .where(searchCondition),
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
      const courseRows = await db
        .select()
        .from(courses)
        .orderBy(asc(courses.sortOrder))
      const latestVersionsByCourseId =
        await listLatestPublishedVersionsByCourseId(db)
      const curriculumVersionIds = [...latestVersionsByCourseId.values()].map(
        (version) => version.id
      )
      const [chapterRows, lessonRows] =
        curriculumVersionIds.length === 0
          ? [[], []]
          : await Promise.all([
              db
                .select()
                .from(curriculumVersionChapters)
                .where(
                  inArray(
                    curriculumVersionChapters.curriculumVersionId,
                    curriculumVersionIds
                  )
                )
                .orderBy(asc(curriculumVersionChapters.sortOrder)),
              db
                .select()
                .from(curriculumVersionLessons)
                .where(
                  inArray(
                    curriculumVersionLessons.curriculumVersionId,
                    curriculumVersionIds
                  )
                )
                .orderBy(asc(curriculumVersionLessons.sortOrder)),
            ])

      return {
        courses: courseRows.map((course) => {
          const version = latestVersionsByCourseId.get(course.id)
          const courseChapters = version
            ? chapterRows.filter(
                (chapter) => chapter.curriculumVersionId === version.id
              )
            : []

          return {
            id: course.id,
            title: course.title,
            description: course.description,
            sortOrder: course.sortOrder,
            chapters: courseChapters.map((chapter) => ({
              id: chapter.id,
              label: chapter.label,
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
          }
        }),
      }
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

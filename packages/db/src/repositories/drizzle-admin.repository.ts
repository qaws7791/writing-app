import { asc, count, like, or } from "drizzle-orm"

import type { AdminRepository } from "@workspace/core/admin"

import type { WritingAppDatabase } from "@/client"
import { courseChapters, courseLessons, courses, user } from "@/schema"

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
              label: chapter.label,
              title: chapter.title,
              sortOrder: chapter.sortOrder,
              lessons: lessonRows
                .filter((lesson) => lesson.chapterId === chapter.id)
                .map((lesson) => ({
                  id: lesson.id,
                  lessonId: lesson.lessonId,
                  title: lesson.title,
                  description: lesson.description,
                  sortOrder: lesson.sortOrder,
                })),
            })),
        })),
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

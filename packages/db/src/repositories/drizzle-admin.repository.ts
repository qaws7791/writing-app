import { and, asc, count, desc, eq, inArray, like, or } from "drizzle-orm"

import type {
  AdminCurriculumVersionDetailDto,
  AdminCurriculumVersionSummaryDto,
  AdminRepository,
} from "@workspace/core/admin"

import type { WritingAppDatabase } from "@/client"
import {
  courses,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  user,
} from "@/schema"

type CurriculumVersionRow = typeof curriculumVersions.$inferSelect
type CurriculumVersionChapterRow = typeof curriculumVersionChapters.$inferSelect
type CurriculumVersionLessonRow = typeof curriculumVersionLessons.$inferSelect
type CurriculumVersionSummaryRow = Pick<
  CurriculumVersionRow,
  | "id"
  | "courseId"
  | "versionNumber"
  | "status"
  | "title"
  | "changelog"
  | "publishedAt"
  | "createdAt"
>

interface DrizzleAdminRepositoryOptions {
  now?: () => Date
}

export function createDrizzleAdminRepository(
  db: WritingAppDatabase,
  options: DrizzleAdminRepositoryOptions = {}
): AdminRepository {
  const now = options.now ?? (() => new Date())

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
    async listCurriculumVersions(courseId) {
      const versionRows = await db
        .select()
        .from(curriculumVersions)
        .where(eq(curriculumVersions.courseId, courseId))
        .orderBy(desc(curriculumVersions.versionNumber))

      return {
        versions: versionRows.map(mapCurriculumVersionSummary),
      }
    },
    async createCurriculumDraft(courseId) {
      return db.transaction(async (tx) => {
        const [existingDraft] = await tx
          .select()
          .from(curriculumVersions)
          .where(
            and(
              eq(curriculumVersions.courseId, courseId),
              eq(curriculumVersions.status, "draft")
            )
          )
          .limit(1)

        if (existingDraft) {
          return {
            status: "invalid-request",
            error: {
              code: "invalid-request",
              message: "Draft curriculum version already exists.",
            },
          }
        }

        const [sourceVersion] = await tx
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

        if (!sourceVersion) {
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "Published curriculum version was not found.",
            },
          }
        }

        const [latestVersion] = await tx
          .select()
          .from(curriculumVersions)
          .where(eq(curriculumVersions.courseId, courseId))
          .orderBy(desc(curriculumVersions.versionNumber))
          .limit(1)
        const versionNumber =
          (latestVersion?.versionNumber ?? sourceVersion.versionNumber) + 1
        const draftVersion = {
          id: `${courseId}-v${versionNumber}`,
          courseId,
          versionNumber,
          status: "draft",
          title: sourceVersion.title,
          changelog: `Draft from v${sourceVersion.versionNumber}`,
          publishedAt: null,
          createdAt: now(),
        } satisfies typeof curriculumVersions.$inferInsert

        await tx.insert(curriculumVersions).values(draftVersion)

        const sourceChapters = await tx
          .select()
          .from(curriculumVersionChapters)
          .where(
            eq(curriculumVersionChapters.curriculumVersionId, sourceVersion.id)
          )
          .orderBy(asc(curriculumVersionChapters.sortOrder))
        const sourceLessons =
          sourceChapters.length === 0
            ? []
            : await tx
                .select()
                .from(curriculumVersionLessons)
                .where(
                  inArray(
                    curriculumVersionLessons.chapterId,
                    sourceChapters.map((chapter) => chapter.id)
                  )
                )
                .orderBy(asc(curriculumVersionLessons.sortOrder))
        const draftChapterIdBySourceChapterId = new Map<string, string>()
        const draftChapters = sourceChapters.map((chapter) => {
          const sourceChapterId = chapter.sourceChapterId ?? chapter.id
          const id = `${sourceChapterId}-v${versionNumber}`
          draftChapterIdBySourceChapterId.set(chapter.id, id)

          return {
            id,
            curriculumVersionId: draftVersion.id,
            sourceChapterId: chapter.sourceChapterId,
            label: chapter.label,
            title: chapter.title,
            sortOrder: chapter.sortOrder,
            status: chapter.status,
          } satisfies typeof curriculumVersionChapters.$inferInsert
        })

        if (draftChapters.length > 0) {
          await tx.insert(curriculumVersionChapters).values(draftChapters)
        }

        const draftLessons = sourceLessons.map((lesson) => ({
          id: `${lesson.lessonId}-v${versionNumber}`,
          curriculumVersionId: draftVersion.id,
          chapterId:
            draftChapterIdBySourceChapterId.get(lesson.chapterId) ??
            lesson.chapterId,
          lessonId: lesson.lessonId,
          title: lesson.title,
          description: lesson.description,
          sortOrder: lesson.sortOrder,
          status: lesson.status,
        })) satisfies (typeof curriculumVersionLessons.$inferInsert)[]

        if (draftLessons.length > 0) {
          await tx.insert(curriculumVersionLessons).values(draftLessons)
        }

        return {
          status: "created",
          version: mapCurriculumVersionSummary(draftVersion),
        }
      })
    },
    async getCurriculumVersionDetail(versionId) {
      const [version] = await db
        .select()
        .from(curriculumVersions)
        .where(eq(curriculumVersions.id, versionId))
        .limit(1)

      if (!version) {
        return undefined
      }

      const chapterRows = await db
        .select()
        .from(curriculumVersionChapters)
        .where(eq(curriculumVersionChapters.curriculumVersionId, version.id))
        .orderBy(asc(curriculumVersionChapters.sortOrder))
      const lessonRows =
        chapterRows.length === 0
          ? []
          : await db
              .select()
              .from(curriculumVersionLessons)
              .where(
                inArray(
                  curriculumVersionLessons.chapterId,
                  chapterRows.map((chapter) => chapter.id)
                )
              )
              .orderBy(asc(curriculumVersionLessons.sortOrder))

      return mapCurriculumVersionDetail(version, chapterRows, lessonRows)
    },
    async publishCurriculumVersion(versionId) {
      return db.transaction(async (tx) => {
        const [version] = await tx
          .select()
          .from(curriculumVersions)
          .where(eq(curriculumVersions.id, versionId))
          .limit(1)

        if (!version) {
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "Curriculum version was not found.",
            },
          }
        }

        if (version.status !== "draft") {
          return {
            status: "invalid-request",
            error: {
              code: "invalid-request",
              message: "Only draft curriculum versions can be published.",
            },
          }
        }

        const publishedAt = now()
        const publishedVersion = {
          ...version,
          status: "published",
          publishedAt,
        } satisfies CurriculumVersionSummaryRow

        await tx
          .update(curriculumVersions)
          .set({
            status: publishedVersion.status,
            publishedAt,
          })
          .where(eq(curriculumVersions.id, version.id))

        return {
          status: "published",
          version: mapCurriculumVersionSummary(publishedVersion),
        }
      })
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

function mapCurriculumVersionSummary(
  version: CurriculumVersionSummaryRow
): AdminCurriculumVersionSummaryDto {
  return {
    id: version.id,
    courseId: version.courseId,
    versionNumber: version.versionNumber,
    status: version.status,
    title: version.title,
    changelog: version.changelog,
    publishedAt: version.publishedAt?.toISOString() ?? null,
    createdAt: version.createdAt.toISOString(),
  }
}

function mapCurriculumVersionDetail(
  version: CurriculumVersionRow,
  chapters: CurriculumVersionChapterRow[],
  lessons: CurriculumVersionLessonRow[]
): AdminCurriculumVersionDetailDto {
  return {
    ...mapCurriculumVersionSummary(version),
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      label: chapter.label,
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

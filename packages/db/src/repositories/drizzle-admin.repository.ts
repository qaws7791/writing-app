import { and, asc, count, desc, eq, inArray, like, or } from "drizzle-orm"

import type {
  AdminCurriculumMigrationApplicationDto,
  AdminCurriculumMigrationDetailDto,
  AdminCurriculumVersionDetailDto,
  AdminCurriculumVersionSummaryDto,
  AdminEditorCurriculumVersionDetailDto,
  AdminEditorLessonDetailDto,
  AdminEditorStepSummaryDto,
  AdminRepository,
} from "@workspace/core/admin"

import type { WritingAppDatabase } from "@/client"
import {
  applyCurriculumMigrationToUser,
  type CurriculumMigrationApplicationRecord,
} from "@/repositories/curriculum-migration-application"
import {
  courses,
  curriculumVersionMigrations,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  lessonSteps,
  lessonMigrationMappings,
  lessons,
  user,
} from "@/schema"

type CurriculumVersionRow = typeof curriculumVersions.$inferSelect
type CurriculumVersionChapterRow = typeof curriculumVersionChapters.$inferSelect
type CurriculumVersionLessonRow = typeof curriculumVersionLessons.$inferSelect
type CurriculumVersionMigrationRow =
  typeof curriculumVersionMigrations.$inferSelect
type LessonMigrationMappingRow = typeof lessonMigrationMappings.$inferSelect
type LessonRow = typeof lessons.$inferSelect
type LessonStepRow = typeof lessonSteps.$inferSelect
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
    async getCourseDetail(courseId) {
      const [course] = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          thumbnailPath: courses.thumbnailPath,
          sortOrder: courses.sortOrder,
        })
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1)

      return course
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
    async getCourseCurriculumVersionDetail(courseId, versionId) {
      const [version] = await db
        .select()
        .from(curriculumVersions)
        .where(
          and(
            eq(curriculumVersions.id, versionId),
            eq(curriculumVersions.courseId, courseId)
          )
        )
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

      return mapEditorCurriculumVersionDetail(
        version,
        chapterRows,
        lessonRows,
        stepRows
      )
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
    async createCurriculumMigration(input) {
      const mappingValidation = validateMigrationMappings(input.mappings)
      if (mappingValidation) {
        return mappingValidation
      }

      return db.transaction(async (tx) => {
        const versionRows = await tx
          .select()
          .from(curriculumVersions)
          .where(
            inArray(curriculumVersions.id, [
              input.fromVersionId,
              input.toVersionId,
            ])
          )
        const fromVersion = versionRows.find(
          (version) => version.id === input.fromVersionId
        )
        const toVersion = versionRows.find(
          (version) => version.id === input.toVersionId
        )

        if (!fromVersion || !toVersion) {
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "Curriculum version was not found.",
            },
          }
        }

        if (fromVersion.id === toVersion.id) {
          return invalidRequest("Migration versions must be different.")
        }

        if (fromVersion.courseId !== toVersion.courseId) {
          return invalidRequest(
            "Migration versions must belong to the same course."
          )
        }

        const migrationId = `${input.fromVersionId}-to-${input.toVersionId}`
        const [existingMigration] = await tx
          .select()
          .from(curriculumVersionMigrations)
          .where(eq(curriculumVersionMigrations.id, migrationId))
          .limit(1)

        if (existingMigration) {
          return invalidRequest("Curriculum migration already exists.")
        }

        const [fromLessonIds, toLessonIds] = await Promise.all([
          listCurriculumVersionLessonIdSet(tx, input.fromVersionId),
          listCurriculumVersionLessonIdSet(tx, input.toVersionId),
        ])

        for (const mapping of input.mappings) {
          if (!fromLessonIds.has(mapping.fromLessonId)) {
            return invalidRequest(
              "Source lesson is not part of the source curriculum version."
            )
          }

          if (mapping.toLessonId && !toLessonIds.has(mapping.toLessonId)) {
            return invalidRequest(
              "Target lesson is not part of the target curriculum version."
            )
          }
        }

        const currentTime = now()
        const migration = {
          id: migrationId,
          fromVersionId: input.fromVersionId,
          toVersionId: input.toVersionId,
          status: "active",
          createdAt: currentTime,
        } satisfies typeof curriculumVersionMigrations.$inferInsert
        const mappings = input.mappings.map((mapping, index) => ({
          id: `${migrationId}-${index + 1}`,
          migrationId,
          fromLessonId: mapping.fromLessonId,
          toLessonId: mapping.toLessonId,
          mappingType: mapping.mappingType,
        })) satisfies (typeof lessonMigrationMappings.$inferInsert)[]

        await tx.insert(curriculumVersionMigrations).values(migration)
        await tx.insert(lessonMigrationMappings).values(mappings)

        return {
          status: "created",
          migration: mapCurriculumMigration(migration, mappings),
        }
      })
    },
    async getCurriculumMigration(migrationId) {
      const [migration] = await db
        .select()
        .from(curriculumVersionMigrations)
        .where(eq(curriculumVersionMigrations.id, migrationId))
        .limit(1)

      if (!migration) {
        return undefined
      }

      const mappings = await db
        .select()
        .from(lessonMigrationMappings)
        .where(eq(lessonMigrationMappings.migrationId, migration.id))
        .orderBy(asc(lessonMigrationMappings.id))

      return mapCurriculumMigration(migration, mappings)
    },
    async applyCurriculumMigration(input) {
      const result = await applyCurriculumMigrationToUser(db, {
        migrationId: input.migrationId,
        now: now(),
        userId: input.userId,
      })

      if (result.status === "applied") {
        return {
          status: "applied",
          application: mapCurriculumMigrationApplication(result.application),
        }
      }

      return result
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

function mapEditorCurriculumVersionDetail(
  version: CurriculumVersionRow,
  chapters: CurriculumVersionChapterRow[],
  lessons: CurriculumVersionLessonRow[],
  steps: LessonStepRow[]
): AdminEditorCurriculumVersionDetailDto {
  return {
    ...mapCurriculumVersionDetail(version, chapters, lessons),
    revision: version.revision,
    steps: steps.map(mapEditorStepSummary),
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
    steps: steps.map((step) => ({
      ...mapEditorStepSummary(step),
      content: JSON.parse(step.contentJson) as unknown,
    })),
  }
}

function mapEditorStepSummary(step: LessonStepRow): AdminEditorStepSummaryDto {
  return {
    id: step.id,
    lessonId: step.lessonId,
    type: step.type,
    title: step.type,
    sortOrder: step.sortOrder,
    points: step.points,
    required: step.required,
    status: step.status,
  }
}

function validateMigrationMappings(
  mappings: {
    fromLessonId: string
    mappingType: "equivalent" | "split" | "merged" | "removed"
    toLessonId: string | null
  }[]
) {
  for (const mapping of mappings) {
    if (mapping.mappingType === "removed" && mapping.toLessonId) {
      return invalidRequest(
        "Removed mappings must not include a target lesson."
      )
    }

    if (mapping.mappingType !== "removed" && !mapping.toLessonId) {
      return invalidRequest(
        "Non-removed mappings must include a target lesson."
      )
    }
  }

  return null
}

function invalidRequest(message: string) {
  return {
    status: "invalid-request",
    error: {
      code: "invalid-request",
      message,
    },
  } as const
}

function mapCurriculumMigration(
  migration: CurriculumVersionMigrationRow,
  mappings: LessonMigrationMappingRow[]
): AdminCurriculumMigrationDetailDto {
  return {
    id: migration.id,
    fromVersionId: migration.fromVersionId,
    toVersionId: migration.toVersionId,
    status: migration.status,
    createdAt: migration.createdAt.toISOString(),
    mappings: mappings.map((mapping) => ({
      id: mapping.id,
      fromLessonId: mapping.fromLessonId,
      toLessonId: mapping.toLessonId,
      mappingType: mapping.mappingType,
    })),
  }
}

async function listCurriculumVersionLessonIdSet(
  db: Pick<WritingAppDatabase, "select">,
  curriculumVersionId: string
) {
  const rows = await db
    .select({ lessonId: curriculumVersionLessons.lessonId })
    .from(curriculumVersionLessons)
    .where(
      eq(curriculumVersionLessons.curriculumVersionId, curriculumVersionId)
    )

  return new Set(rows.map((row) => row.lessonId))
}

function mapCurriculumMigrationApplication(
  application: CurriculumMigrationApplicationRecord
): AdminCurriculumMigrationApplicationDto {
  return {
    id: application.id,
    migrationId: application.migrationId,
    userId: application.userId,
    courseId: application.courseId,
    fromVersionId: application.fromVersionId,
    toVersionId: application.toVersionId,
    status: application.status,
    completedLessonCount: application.completedLessonCount,
    completedLessonIds: application.completedLessonIds,
    preservedLessonIds: application.preservedLessonIds,
    skippedLessonIds: application.skippedLessonIds,
    errorMessage: application.errorMessage,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
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

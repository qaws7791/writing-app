import { and, asc, count, desc, eq, inArray, like, or } from "drizzle-orm"

import type {
  AdminCurriculumMigrationApplicationDto,
  AdminCurriculumMigrationDetailDto,
  AdminCurriculumVersionDetailDto,
  AdminCurriculumVersionSummaryDto,
  AdminEditorCurriculumVersionDetailDto,
  AdminEditorLessonDetailDto,
  AdminSaveCurriculumVersionContentRequestDto,
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
  curriculumVersionSteps,
  curriculumVersions,
  lessonMigrationMappings,
  lessons,
  user,
} from "@/schema"

type CurriculumVersionRow = typeof curriculumVersions.$inferSelect
type CurriculumVersionChapterRow = typeof curriculumVersionChapters.$inferSelect
type CurriculumVersionLessonRow = typeof curriculumVersionLessons.$inferSelect
type CurriculumVersionStepRow = typeof curriculumVersionSteps.$inferSelect
type CurriculumVersionMigrationRow =
  typeof curriculumVersionMigrations.$inferSelect
type LessonMigrationMappingRow = typeof lessonMigrationMappings.$inferSelect
type LessonRow = typeof lessons.$inferSelect
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

type AdminEditorTransaction = Pick<
  WritingAppDatabase,
  "delete" | "insert" | "select" | "update"
>

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
    async getCourseEditorDocument(courseId, versionId) {
      const [course, versionList] = await Promise.all([
        db
          .select({
            id: courses.id,
            title: courses.title,
            description: courses.description,
            thumbnailPath: courses.thumbnailPath,
            sortOrder: courses.sortOrder,
          })
          .from(courses)
          .where(eq(courses.id, courseId))
          .limit(1),
        db
          .select()
          .from(curriculumVersions)
          .where(eq(curriculumVersions.courseId, courseId))
          .orderBy(desc(curriculumVersions.versionNumber)),
      ])

      const courseRow = course[0]

      if (!courseRow || versionList.length === 0) {
        return undefined
      }

      const selectedVersion =
        (versionId
          ? versionList.find((version) => version.id === versionId)
          : versionList.find((version) => version.status === "draft")) ??
        versionList[0]

      if (!selectedVersion) {
        return undefined
      }

      const version = await getEditorVersionDetailRows(db, {
        courseId,
        versionId: selectedVersion.id,
      })

      if (!version) {
        return undefined
      }

      return {
        course: courseRow,
        versions: versionList.map(mapCurriculumVersionSummary),
        version,
      }
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
              message: "이미 커리큘럼 초안 버전이 있습니다.",
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
              message: "발행된 커리큘럼 버전을 찾을 수 없습니다.",
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
        const draftVersion = await createDraftVersionFromSource(tx, {
          courseId,
          createdAt: now(),
          sourceVersion,
          versionNumber,
        })

        return {
          status: "created",
          version: mapCurriculumVersionSummary(draftVersion),
        }
      })
    },
    async restoreCurriculumDraft(courseId, input) {
      return db.transaction(async (tx) => {
        const [sourceVersion] = await tx
          .select()
          .from(curriculumVersions)
          .where(
            and(
              eq(curriculumVersions.id, input.sourceVersionId),
              eq(curriculumVersions.courseId, courseId),
              eq(curriculumVersions.status, "published")
            )
          )
          .limit(1)

        if (!sourceVersion) {
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "발행된 커리큘럼 버전을 찾을 수 없습니다.",
            },
          }
        }

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

        if (existingDraft && !input.replaceDraft) {
          return invalidRequest("이미 커리큘럼 초안 버전이 있습니다.")
        }

        if (existingDraft) {
          await deleteDraftVersion(tx, existingDraft.id)
        }

        const [latestVersion] = await tx
          .select()
          .from(curriculumVersions)
          .where(eq(curriculumVersions.courseId, courseId))
          .orderBy(desc(curriculumVersions.versionNumber))
          .limit(1)
        const versionNumber =
          (latestVersion?.versionNumber ?? sourceVersion.versionNumber) + 1
        const draftVersion = await createDraftVersionFromSource(tx, {
          courseId,
          createdAt: now(),
          sourceVersion,
          versionNumber,
        })

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
              .from(curriculumVersionSteps)
              .where(
                and(
                  eq(curriculumVersionSteps.curriculumVersionId, version.id),
                  inArray(
                    curriculumVersionSteps.lessonId,
                    lessonRows.map((lesson) => lesson.lessonId)
                  )
                )
              )
              .orderBy(
                asc(curriculumVersionSteps.lessonId),
                asc(curriculumVersionSteps.sortOrder)
              )

      return mapEditorCurriculumVersionDetail(
        version,
        chapterRows,
        lessonRows,
        stepRows
      )
    },
    async getCourseLessonDetail(courseId, versionId, lessonId) {
      const [versionLesson] = await db
        .select()
        .from(curriculumVersionLessons)
        .where(
          and(
            eq(curriculumVersionLessons.curriculumVersionId, versionId),
            eq(curriculumVersionLessons.lessonId, lessonId)
          )
        )
        .limit(1)

      if (!versionLesson) {
        return undefined
      }

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
        .from(curriculumVersionSteps)
        .where(
          and(
            eq(curriculumVersionSteps.curriculumVersionId, versionId),
            eq(curriculumVersionSteps.lessonId, lesson.id)
          )
        )
        .orderBy(asc(curriculumVersionSteps.sortOrder))

      return mapEditorLessonDetail(lesson, stepRows)
    },
    async saveCurriculumVersionContent(input) {
      return db.transaction(async (tx) => {
        return saveEditorDocumentSnapshot(tx, input)
      })
    },
    async saveCourseEditorDocument(input) {
      return db.transaction(async (tx) => {
        return saveEditorDocumentSnapshot(tx, input)
      })
    },
    async discardCurriculumVersion(courseId, versionId) {
      return db.transaction(async (tx) => {
        const [version] = await tx
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
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "커리큘럼 버전을 찾을 수 없습니다.",
            },
          }
        }

        if (version.status !== "draft") {
          return invalidRequest("초안 커리큘럼 버전만 폐기할 수 있습니다.")
        }

        await deleteDraftVersion(tx, version.id)

        return {
          status: "discarded",
          versionId: version.id,
        }
      })
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
              message: "커리큘럼 버전을 찾을 수 없습니다.",
            },
          }
        }

        if (version.status !== "draft") {
          return {
            status: "invalid-request",
            error: {
              code: "invalid-request",
              message: "초안 커리큘럼 버전만 발행할 수 있습니다.",
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
              message: "커리큘럼 버전을 찾을 수 없습니다.",
            },
          }
        }

        if (fromVersion.id === toVersion.id) {
          return invalidRequest(
            "마이그레이션의 원본 버전과 대상 버전은 달라야 합니다."
          )
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
          return invalidRequest("커리큘럼 마이그레이션이 이미 있습니다.")
        }

        const [fromLessonIds, toLessonIds] = await Promise.all([
          listCurriculumVersionLessonIdSet(tx, input.fromVersionId),
          listCurriculumVersionLessonIdSet(tx, input.toVersionId),
        ])

        for (const mapping of input.mappings) {
          if (!fromLessonIds.has(mapping.fromLessonId)) {
            return invalidRequest(
              "원본 레슨이 원본 커리큘럼 버전에 포함되어 있지 않습니다."
            )
          }

          if (mapping.toLessonId && !toLessonIds.has(mapping.toLessonId)) {
            return invalidRequest(
              "대상 레슨이 대상 커리큘럼 버전에 포함되어 있지 않습니다."
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

async function createDraftVersionFromSource(
  tx: AdminEditorTransaction,
  input: {
    courseId: string
    createdAt: Date
    sourceVersion: CurriculumVersionRow
    versionNumber: number
  }
) {
  const draftVersion = {
    id: `${input.courseId}-v${input.versionNumber}`,
    courseId: input.courseId,
    versionNumber: input.versionNumber,
    status: "draft",
    title: input.sourceVersion.title,
    changelog: `Draft from v${input.sourceVersion.versionNumber}`,
    publishedAt: null,
    createdAt: input.createdAt,
  } satisfies typeof curriculumVersions.$inferInsert

  await tx.insert(curriculumVersions).values(draftVersion)

  const sourceChapters = await tx
    .select()
    .from(curriculumVersionChapters)
    .where(
      eq(curriculumVersionChapters.curriculumVersionId, input.sourceVersion.id)
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
  const sourceSteps =
    sourceLessons.length === 0
      ? []
      : await tx
          .select()
          .from(curriculumVersionSteps)
          .where(
            and(
              eq(
                curriculumVersionSteps.curriculumVersionId,
                input.sourceVersion.id
              ),
              inArray(
                curriculumVersionSteps.lessonId,
                sourceLessons.map((lesson) => lesson.lessonId)
              )
            )
          )
          .orderBy(
            asc(curriculumVersionSteps.lessonId),
            asc(curriculumVersionSteps.sortOrder)
          )
  const draftChapterIdBySourceChapterId = new Map<string, string>()
  const draftChapters = sourceChapters.map((chapter) => {
    const sourceChapterId = chapter.sourceChapterId ?? chapter.id
    const id = `${sourceChapterId}-v${input.versionNumber}`
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
    id: `${lesson.lessonId}-v${input.versionNumber}`,
    curriculumVersionId: draftVersion.id,
    chapterId:
      draftChapterIdBySourceChapterId.get(lesson.chapterId) ?? lesson.chapterId,
    lessonId: lesson.lessonId,
    title: lesson.title,
    description: lesson.description,
    sortOrder: lesson.sortOrder,
    status: lesson.status,
  })) satisfies (typeof curriculumVersionLessons.$inferInsert)[]

  if (draftLessons.length > 0) {
    await tx.insert(curriculumVersionLessons).values(draftLessons)
  }

  const draftSteps = sourceSteps.map((step) => {
    const sourceStepId = step.sourceStepId ?? step.id

    return {
      id: `${sourceStepId}-v${input.versionNumber}`,
      curriculumVersionId: draftVersion.id,
      lessonId: step.lessonId,
      sourceStepId,
      type: step.type,
      sortOrder: step.sortOrder,
      points: step.points,
      required: step.required,
      status: step.status,
      contentJson: step.contentJson,
    } satisfies typeof curriculumVersionSteps.$inferInsert
  })

  if (draftSteps.length > 0) {
    await tx.insert(curriculumVersionSteps).values(draftSteps)
  }

  return draftVersion
}

async function getEditorVersionDetailRows(
  db: Pick<WritingAppDatabase, "select">,
  input: {
    courseId: string
    versionId: string
  }
) {
  const [version] = await db
    .select()
    .from(curriculumVersions)
    .where(
      and(
        eq(curriculumVersions.id, input.versionId),
        eq(curriculumVersions.courseId, input.courseId)
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
          .from(curriculumVersionSteps)
          .where(
            and(
              eq(curriculumVersionSteps.curriculumVersionId, version.id),
              inArray(
                curriculumVersionSteps.lessonId,
                lessonRows.map((lesson) => lesson.lessonId)
              )
            )
          )
          .orderBy(
            asc(curriculumVersionSteps.lessonId),
            asc(curriculumVersionSteps.sortOrder)
          )

  return mapEditorCurriculumVersionDetail(
    version,
    chapterRows,
    lessonRows,
    stepRows
  )
}

async function saveEditorDocumentSnapshot(
  tx: AdminEditorTransaction,
  input: AdminSaveCurriculumVersionContentRequestDto
) {
  const [version] = await tx
    .select()
    .from(curriculumVersions)
    .where(
      and(
        eq(curriculumVersions.id, input.versionId),
        eq(curriculumVersions.courseId, input.courseId)
      )
    )
    .limit(1)

  if (!version) {
    return {
      status: "not-found",
      error: {
        code: "not-found",
        message: "커리큘럼 버전을 찾을 수 없습니다.",
      },
    } as const
  }

  if (version.status !== "draft") {
    return invalidRequest("초안 커리큘럼 버전만 저장할 수 있습니다.")
  }

  if (version.revision !== input.baseRevision) {
    return {
      status: "conflict",
      error: {
        code: "conflict",
        message: "커리큘럼 버전이 변경되었습니다.",
      },
    } as const
  }

  await ensureEditorLessons(tx, input)
  await tx
    .update(courses)
    .set({
      title: input.course.title,
      description: input.course.description,
      thumbnailPath: input.course.thumbnailPath,
      sortOrder: input.course.sortOrder,
    })
    .where(eq(courses.id, input.courseId))
  await deleteDraftSnapshot(tx, version.id)

  if (input.chapters.length > 0) {
    await tx.insert(curriculumVersionChapters).values(
      input.chapters.map((chapter) => ({
        id: chapter.id,
        curriculumVersionId: version.id,
        sourceChapterId: null,
        label: chapter.label,
        title: chapter.title,
        sortOrder: chapter.sortOrder,
        status: chapter.status,
      }))
    )
  }

  if (input.lessons.length > 0) {
    await tx.insert(curriculumVersionLessons).values(
      input.lessons.map((lesson) => ({
        id: lesson.id,
        curriculumVersionId: version.id,
        chapterId: lesson.chapterId,
        lessonId: lesson.lessonId,
        title: lesson.title,
        description: lesson.description,
        sortOrder: lesson.sortOrder,
        status: lesson.status,
      }))
    )
  }

  if (input.steps.length > 0) {
    await tx.insert(curriculumVersionSteps).values(
      input.steps.map((step) => ({
        id: step.id,
        curriculumVersionId: version.id,
        lessonId: step.lessonId,
        sourceStepId: null,
        type: step.type,
        sortOrder: step.sortOrder,
        points: step.points,
        required: step.required,
        status: step.status,
        contentJson: JSON.stringify(step.content),
      }))
    )
  }

  const nextRevision = version.revision + 1
  await tx
    .update(curriculumVersions)
    .set({ revision: nextRevision })
    .where(eq(curriculumVersions.id, version.id))

  return {
    status: "saved",
    version: {
      ...mapCurriculumVersionSummary(version),
      revision: nextRevision,
      chapters: input.chapters.map((chapter) => ({
        ...chapter,
        lessons: input.lessons
          .filter((lesson) => lesson.chapterId === chapter.id)
          .map(({ chapterId: _chapterId, ...lesson }) => lesson),
      })),
      steps: input.steps,
    },
  } as const
}

async function ensureEditorLessons(
  tx: AdminEditorTransaction,
  input: AdminSaveCurriculumVersionContentRequestDto
) {
  if (input.lessons.length === 0) {
    return
  }

  const [course] = await tx
    .select({
      categoryId: courses.categoryId,
    })
    .from(courses)
    .where(eq(courses.id, input.courseId))
    .limit(1)

  if (!course) {
    return
  }

  const existingLessons = await tx
    .select({
      id: lessons.id,
      unitNumber: lessons.unitNumber,
    })
    .from(lessons)
    .where(eq(lessons.courseId, input.courseId))
  const existingLessonIds = new Set(existingLessons.map((lesson) => lesson.id))
  const missingLessons = input.lessons.filter(
    (lesson) => !existingLessonIds.has(lesson.lessonId)
  )

  if (missingLessons.length === 0) {
    return
  }

  const maxUnitNumber = Math.max(
    0,
    ...existingLessons.map((lesson) => lesson.unitNumber)
  )

  await tx.insert(lessons).values(
    missingLessons.map((lesson, index) => ({
      id: lesson.lessonId,
      courseId: input.courseId,
      title: lesson.title,
      categoryId: course.categoryId,
      unitNumber: maxUnitNumber + index + 1,
      nextLessonId: null,
    }))
  )
}

async function deleteDraftSnapshot(
  tx: AdminEditorTransaction,
  versionId: string
) {
  await tx
    .delete(curriculumVersionSteps)
    .where(eq(curriculumVersionSteps.curriculumVersionId, versionId))
  await tx
    .delete(curriculumVersionLessons)
    .where(eq(curriculumVersionLessons.curriculumVersionId, versionId))
  await tx
    .delete(curriculumVersionChapters)
    .where(eq(curriculumVersionChapters.curriculumVersionId, versionId))
}

async function deleteDraftVersion(
  tx: AdminEditorTransaction,
  versionId: string
) {
  await deleteDraftSnapshot(tx, versionId)
  await tx
    .delete(curriculumVersions)
    .where(eq(curriculumVersions.id, versionId))
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
  steps: CurriculumVersionStepRow[]
): AdminEditorCurriculumVersionDetailDto {
  return {
    ...mapCurriculumVersionDetail(version, chapters, lessons),
    revision: version.revision,
    steps: steps.map(mapEditorStepDetail),
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
  steps: CurriculumVersionStepRow[]
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

function mapEditorStepDetail(step: CurriculumVersionStepRow) {
  return {
    ...mapEditorStepSummary(step),
    content: JSON.parse(step.contentJson) as unknown,
  }
}

function mapEditorStepSummary(
  step: CurriculumVersionStepRow
): AdminEditorStepSummaryDto {
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

function getStepDisplayTitle(step: CurriculumVersionStepRow) {
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

function validateMigrationMappings(
  mappings: {
    fromLessonId: string
    mappingType: "equivalent" | "split" | "merged" | "removed"
    toLessonId: string | null
  }[]
) {
  for (const mapping of mappings) {
    if (mapping.mappingType === "removed" && mapping.toLessonId) {
      return invalidRequest("제거 매핑에는 대상 레슨을 포함할 수 없습니다.")
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

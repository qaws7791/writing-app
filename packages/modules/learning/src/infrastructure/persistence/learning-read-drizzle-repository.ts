import { and, asc, desc, eq } from "drizzle-orm"
import { createHmac } from "node:crypto"

import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  ContentAssetId,
  CourseId,
  LearnerId,
  LessonId,
} from "@workspace/types/ids"

import {
  projectLearnerCourseDetail,
  projectLearnerCoursePage,
  projectLearnerProgressCourse,
  projectLearnerProgressPageWindow,
  presentLearnerStep,
  type LearnerCourseProjectionBundle,
} from "#learning/infrastructure/persistence/learner-read-mapping"
import type { LearnerCourseDetail } from "#learning/application/learning-read-model"
import type { LearnerContentAssetReference } from "#learning/application/learning-read-model"
import {
  resolveLearnerCourseCursorCondition,
  resolveLearnerProgressCursorCondition,
} from "#learning/infrastructure/persistence/learner-cursor"
import { readLearnerStepDrafts } from "#learning/infrastructure/persistence/learner-step-draft-drizzle"
import type {
  LearnerCourseReadQuery,
  LearnerProgressReadQuery,
  LearnerReadModelRepository,
} from "#learning/application/ports/learner-read-model-repository"
import type { LearningContentQueryPort } from "#learning/application/ports/learning-ports"
import type { LearningCurriculum } from "#learning/domain/learning-types"
import {
  learnerCourseProgress,
  learnerLessonProgress,
} from "#learning/infrastructure/persistence/schema"

export function createDrizzleLearningReadRepository(
  database: WritingAppDatabase,
  input: Readonly<{
    content: LearningContentQueryPort
    presentationSecret: string
  }>
): LearnerReadModelRepository {
  return {
    findCourseDetail: (query) =>
      findCourseDetail(database, input.content, query),
    findLesson: (query) =>
      findLesson(database, input.content, input.presentationSecret, query),
    async listCourseCategories() {
      const courses = await input.content.listPublishedCourses()
      return [
        ...new Set(courses.map((course) => course.category.normalize("NFC"))),
      ].sort((left, right) => left.localeCompare(right, "ko"))
    },
    listCourses: (query) => listCourses(input.content, query),
    listProgress: (query) => listProgress(database, input.content, query),
  }
}

async function listCourses(
  content: LearningContentQueryPort,
  query: LearnerCourseReadQuery
) {
  const normalizedCategory = query.category?.normalize("NFC")
  const publishedCourses = await content.listPublishedCourses()
  const assetReferencesById = await resolveAssetReferencesById(
    content,
    publishedCourses.flatMap((course) =>
      course.coverAssetId === null ? [] : [course.coverAssetId]
    )
  )
  const rows = publishedCourses
    .filter(
      (course) =>
        normalizedCategory === undefined ||
        course.category.normalize("NFC") === normalizedCategory
    )
    .map((course) => ({
      category: course.category,
      contentStatus: "active" as const,
      cover: resolveCoverReference(assetReferencesById, course.coverAssetId),
      description: course.description,
      id: course.courseId,
      lessonCount: course.lessonCount,
      revision: course.revision,
      sortOrder: course.sortOrder,
      title: course.title,
      versionId: course.versionId,
      visualKey: course.visualKey,
    }))
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.id.localeCompare(right.id)
    )
  const cursor = resolveLearnerCourseCursorCondition(query.after)
  const afterRows = rows.filter((row) => isCourseAfterCursor(row, cursor))

  return projectLearnerCoursePage({
    limit: query.limit,
    rows: afterRows.slice(0, query.limit + 1),
  })
}

async function findCourseDetail(
  database: WritingAppDatabase,
  content: LearningContentQueryPort,
  input: Readonly<{ courseId: CourseId; userId: LearnerId }>
): Promise<LearnerCourseDetail | null> {
  const progress = database
    .select()
    .from(learnerCourseProgress)
    .where(
      and(
        eq(learnerCourseProgress.userId, input.userId),
        eq(learnerCourseProgress.courseId, input.courseId)
      )
    )
    .get()
  const curriculum = await content.readCurriculum({
    courseId: courseIdSchema.parse(input.courseId),
    curriculumVersionId:
      progress === undefined
        ? undefined
        : curriculumVersionIdSchema.parse(progress.curriculumVersionId),
  })

  if (curriculum === null) return null
  const assetReferencesById = await resolveAssetReferencesById(
    content,
    curriculum.coverAssetId === null ? [] : [curriculum.coverAssetId]
  )
  return projectCourseDetail(
    database,
    curriculum,
    input.userId,
    progress,
    resolveCoverReference(assetReferencesById, curriculum.coverAssetId)
  )
}

function projectCourseDetail(
  database: WritingAppDatabase,
  curriculum: LearningCurriculum,
  userId: LearnerId,
  courseProgress: typeof learnerCourseProgress.$inferSelect | undefined,
  cover: LearnerContentAssetReference | null
): LearnerCourseDetail {
  const activeUnits = curriculum.units
    .filter((unit) => unit.status === "active")
    .sort((left, right) => left.sortOrder - right.sortOrder)
  const activeUnitIds = new Set(activeUnits.map((unit) => unit.id))
  const lessons = curriculum.lessons
    .filter(
      (lesson) => lesson.status === "active" && activeUnitIds.has(lesson.unitId)
    )
    .sort(
      (left, right) =>
        left.unitSortOrder - right.unitSortOrder ||
        left.sortOrder - right.sortOrder ||
        left.id.localeCompare(right.id)
    )
  const progressRows = database
    .select()
    .from(learnerLessonProgress)
    .where(
      and(
        eq(learnerLessonProgress.userId, userId),
        eq(
          learnerLessonProgress.curriculumVersionId,
          curriculum.curriculumVersionId
        )
      )
    )
    .all()
  const bundle: LearnerCourseProjectionBundle = {
    course: {
      contentStatus: curriculum.contentStatus ?? "active",
      id: curriculum.courseId,
    },
    courseProgress:
      courseProgress === undefined
        ? undefined
        : {
            completedAt: courseProgress.completedAt,
            lastActivityAt: courseProgress.lastActivityAt,
            status: courseProgress.status,
          },
    lessonProgress: progressRows.map((row) => ({
      completedAt: row.completedAt,
      currentStepId: lessonStepIdSchema.parse(row.currentStepId),
      lessonId: lessonIdSchema.parse(row.lessonId),
      status: row.status,
      updatedAt: row.updatedAt,
    })),
    lessons: lessons.map((lesson) => ({
      category: lesson.category,
      contentStatus: lesson.status,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      id: lesson.id,
      sortOrder: lesson.sortOrder,
      title: lesson.title,
      unitId: lesson.unitId,
    })),
    steps: lessons.flatMap((lesson) =>
      lesson.steps.map((step) => ({
        id: step.id,
        lessonId: lesson.id,
        sortOrder: step.sortOrder,
      }))
    ),
    units: activeUnits.map((unit) => ({
      id: unit.id,
      sortOrder: unit.sortOrder,
      title: unit.title,
    })),
    version: {
      category: curriculum.category,
      cover,
      description: curriculum.description,
      id: curriculum.curriculumVersionId,
      revision: curriculum.revision,
      title: curriculum.title,
      visualKey: curriculum.visualKey,
    },
  }

  return projectLearnerCourseDetail(bundle)
}

async function findLesson(
  database: WritingAppDatabase,
  content: LearningContentQueryPort,
  presentationSecret: string,
  input: Readonly<{ lessonId: LessonId; userId: LearnerId }>
) {
  const pinned = database
    .select({
      courseId: learnerLessonProgress.courseId,
      curriculumVersionId: learnerLessonProgress.curriculumVersionId,
    })
    .from(learnerLessonProgress)
    .where(
      and(
        eq(learnerLessonProgress.userId, input.userId),
        eq(learnerLessonProgress.lessonId, input.lessonId)
      )
    )
    .get()
  const curriculum =
    pinned === undefined
      ? await content.findCurriculumByLesson({
          lessonId: lessonIdSchema.parse(input.lessonId),
        })
      : await content.readCurriculum({
          courseId: courseIdSchema.parse(pinned.courseId),
          curriculumVersionId: curriculumVersionIdSchema.parse(
            pinned.curriculumVersionId
          ),
        })
  if (curriculum === null) return { kind: "not-found" as const }

  const lesson = curriculum.lessons.find(
    (candidate) =>
      candidate.id === input.lessonId && candidate.status === "active"
  )
  if (lesson === undefined || lesson.steps.length === 0) {
    return { kind: "not-found" as const }
  }

  const courseProgress = database
    .select()
    .from(learnerCourseProgress)
    .where(
      and(
        eq(learnerCourseProgress.userId, input.userId),
        eq(learnerCourseProgress.courseId, curriculum.courseId)
      )
    )
    .get()
  const assetReferencesById = await resolveAssetReferencesById(content, [
    ...(curriculum.coverAssetId === null ? [] : [curriculum.coverAssetId]),
    ...curriculum.lessons.flatMap((curriculumLesson) =>
      curriculumLesson.steps.flatMap((step) =>
        step.type === "READING" && step.illustrationAssetId !== undefined
          ? [step.illustrationAssetId]
          : []
      )
    ),
  ])
  const course = projectCourseDetail(
    database,
    curriculum,
    input.userId,
    courseProgress,
    resolveCoverReference(assetReferencesById, curriculum.coverAssetId)
  )
  const lessonSummary = course.units
    .flatMap((unit) => unit.lessons)
    .find((entry) => entry.id === input.lessonId)
  if (lessonSummary === undefined) {
    return { kind: "not-found" as const }
  }
  if (lessonSummary.learning.status === "locked") {
    return { kind: "locked" as const }
  }

  const learnerScope = createHmac("sha256", presentationSecret)
    .update(`presentation:${input.userId}`)
    .digest("base64url")
  const steps = [...lesson.steps]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((step) =>
      presentLearnerStep(step, {
        assetReferencesById,
        learnerScope,
        lessonId: lesson.id,
        versionId: curriculum.curriculumVersionId,
      })
    )

  return {
    kind: "found" as const,
    value: {
      category: lesson.category,
      courseId: curriculum.courseId,
      description: lesson.description,
      drafts: readLearnerStepDrafts(database, {
        courseId: curriculum.courseId,
        curriculumVersionId: curriculum.curriculumVersionId,
        lessonId: lesson.id,
        userId: input.userId,
      }),
      estimatedMinutes: lesson.estimatedMinutes,
      id: lesson.id,
      learning: lessonSummary.learning,
      steps,
      summary: lesson.summary,
      title: lesson.title,
      unitId: lesson.unitId,
      version: course.version,
    },
  }
}

async function resolveAssetReferencesById(
  content: LearningContentQueryPort,
  assetIds: readonly ContentAssetId[]
): Promise<ReadonlyMap<string, LearnerContentAssetReference>> {
  const uniqueAssetIds = [...new Set(assetIds)]
  if (uniqueAssetIds.length === 0) return new Map()
  const references = await content.resolveAssetReferences(uniqueAssetIds)
  return new Map(references.map((reference) => [reference.id, reference]))
}

function resolveCoverReference(
  references: ReadonlyMap<string, LearnerContentAssetReference>,
  assetId: ContentAssetId | null
): LearnerContentAssetReference | null {
  if (assetId === null) return null
  const reference = references.get(assetId)
  if (reference === undefined || reference.kind !== "course-cover") {
    throw new Error(`Published course cover is missing: ${assetId}`)
  }
  return reference
}

async function listProgress(
  database: WritingAppDatabase,
  content: LearningContentQueryPort,
  query: LearnerProgressReadQuery
) {
  const rows = database
    .select({
      courseId: learnerCourseProgress.courseId,
      lastActivityAt: learnerCourseProgress.lastActivityAt,
    })
    .from(learnerCourseProgress)
    .where(
      and(
        eq(learnerCourseProgress.userId, query.userId),
        query.status === undefined
          ? undefined
          : eq(learnerCourseProgress.status, query.status)
      )
    )
    .orderBy(
      desc(learnerCourseProgress.lastActivityAt),
      asc(learnerCourseProgress.courseId)
    )
    .all()
    .map((row) => ({
      courseId: courseIdSchema.parse(row.courseId),
      lastActivityAt: row.lastActivityAt,
    }))
  const cursor = resolveLearnerProgressCursorCondition(query.after)
  const afterRows = rows.filter((row) => isProgressAfterCursor(row, cursor))
  const { nextPosition, pageRows } = projectLearnerProgressPageWindow(
    afterRows.slice(0, query.limit + 1),
    query.limit
  )
  const items = await Promise.all(
    pageRows.map(async (row) => {
      const course = await findCourseDetail(database, content, {
        courseId: courseIdSchema.parse(row.courseId),
        userId: query.userId,
      })
      if (course === null) {
        throw new Error(`Pinned learner course is missing: ${row.courseId}`)
      }
      return projectLearnerProgressCourse(course)
    })
  )

  return { items, nextPosition }
}

type CourseRow = Readonly<{
  id: CourseId
  sortOrder: number
}>

function isCourseAfterCursor(
  row: CourseRow,
  cursor: ReturnType<typeof resolveLearnerCourseCursorCondition>
): boolean {
  if (cursor.kind === "first-page") return true
  if (cursor.kind === "invalid-primary") return false
  return (
    row.sortOrder > cursor.primary ||
    (row.sortOrder === cursor.primary && row.id > cursor.courseId)
  )
}

function isProgressAfterCursor(
  row: Readonly<{ courseId: CourseId; lastActivityAt: Date }>,
  cursor: ReturnType<typeof resolveLearnerProgressCursorCondition>
): boolean {
  if (cursor.kind === "first-page") return true
  if (cursor.kind === "invalid-primary") return false
  const primary = row.lastActivityAt.getTime()
  return (
    primary < cursor.primary ||
    (primary === cursor.primary && row.courseId > cursor.courseId)
  )
}

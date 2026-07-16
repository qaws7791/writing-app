import { createHmac } from "node:crypto"
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  like,
  lt,
  or,
  sql,
} from "drizzle-orm"
import { z } from "zod"

import type {
  CourseLearningState,
  LearnerCourseDetail,
  LearnerCourseSort,
  LearnerLessonStep,
  LessonLearningState,
} from "@workspace/contracts/learning"
import {
  courseLearningStateSchema,
  curriculumVersionRefSchema,
  learnerCourseDetailSchema,
  learnerCourseSummarySchema,
  learnerLessonSchema,
  learnerLessonStepSchema,
  learnerProgressCourseSchema,
  lessonLearningStateSchema,
} from "@workspace/contracts/learning"
import {
  lessonStepDtoSchema,
  type LessonStepDto,
} from "@workspace/contracts/content"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  learnerCourseProgress,
  learnerLessonProgress,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/db/schema"

import type {
  LearnerCourseListRepositoryQuery,
  LearnerProgressListRepositoryQuery,
  LearnerReadModelRepository,
} from "#core/modules/learning/application/ports/learner-read-model.repository"

const activeStatus = "active" as const
const lessonSummarySchema = z.array(z.string())
const rawStepContentSchema = z.object({ type: z.string() }).passthrough()

export function createDrizzleLearnerReadModelRepository(
  db: WritingAppDatabase,
  { presentationSecret }: { readonly presentationSecret: string }
): LearnerReadModelRepository {
  return {
    findCourseDetail(input) {
      return Promise.resolve(findCourseDetail(db, input))
    },
    findLesson(input) {
      return Promise.resolve(findLesson(db, input, presentationSecret))
    },
    listCourseCategories() {
      return Promise.resolve(listCourseCategories(db))
    },
    listCourses(query) {
      return Promise.resolve(listCourses(db, query))
    },
    listProgress(query) {
      return Promise.resolve(listProgress(db, query))
    },
  }
}

function createCourseListSubquery(db: WritingAppDatabase) {
  return db
    .select({
      category: courseCurriculumVersions.category,
      contentStatus: courses.status,
      description: courseCurriculumVersions.description,
      id: courses.id,
      lessonCount: count(lessonVersions.id).as("lesson_count"),
      revision: courseCurriculumVersions.revision,
      sortOrder: courses.sortOrder,
      title: courseCurriculumVersions.title,
      titleSortKey:
        sql<string>`lower(${courseCurriculumVersions.title}) COLLATE BINARY`.as(
          "title_sort_key"
        ),
      versionId: courseCurriculumVersions.id,
      visualKey: courseCurriculumVersions.visualKey,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
    )
    .leftJoin(
      lessonVersions,
      and(
        eq(lessonVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .where(eq(courses.status, activeStatus))
    .groupBy(courses.id, courseCurriculumVersions.id)
    .as("learner_course_list")
}

function listCourses(
  db: WritingAppDatabase,
  query: LearnerCourseListRepositoryQuery
) {
  const courseList = createCourseListSubquery(db)
  const normalizedQuery = query.query?.normalize("NFC").toLowerCase()
  const normalizedCategory = query.category?.normalize("NFC")
  const primary = getCourseSortPrimary(courseList, query.sort)
  const predicates = [
    normalizedCategory === undefined
      ? undefined
      : eq(courseList.category, normalizedCategory),
    normalizedQuery === undefined
      ? undefined
      : or(
          like(sql`lower(${courseList.title})`, `%${normalizedQuery}%`),
          like(sql`lower(${courseList.description})`, `%${normalizedQuery}%`),
          like(sql`lower(${courseList.category})`, `%${normalizedQuery}%`)
        ),
    toCourseCursorCondition(courseList, query.sort, query.after),
  ].filter((value) => value !== undefined)
  const rows = db
    .select()
    .from(courseList)
    .where(predicates.length === 0 ? undefined : and(...predicates))
    .orderBy(...getCourseOrder(primary, courseList.id, query.sort))
    .limit(query.limit + 1)
    .all()
  const pageRows = rows.slice(0, query.limit)
  const items = pageRows.map((row) =>
    learnerCourseSummarySchema.parse({
      category: row.category,
      contentStatus: row.contentStatus,
      description: row.description,
      id: row.id,
      lessonCount: row.lessonCount,
      title: row.title,
      version: {
        curriculumVersionId: row.versionId,
        revision: row.revision,
      },
      visualKey: row.visualKey,
    })
  )
  const lastRow = rows.length > query.limit ? pageRows.at(-1) : undefined

  return {
    items,
    nextPosition:
      lastRow === undefined
        ? null
        : {
            courseId: lastRow.id,
            primary: readCoursePrimary(lastRow, query.sort),
          },
  }
}

function getCourseSortPrimary(
  courseList: ReturnType<typeof createCourseListSubquery>,
  sort: LearnerCourseSort
) {
  switch (sort) {
    case "recommended":
      return courseList.sortOrder
    case "title-asc":
    case "title-desc":
      return courseList.titleSortKey
    case "lesson-count-asc":
    case "lesson-count-desc":
      return courseList.lessonCount
  }
}

function getCourseOrder(
  primary: ReturnType<typeof getCourseSortPrimary>,
  courseId: ReturnType<typeof createCourseListSubquery>["id"],
  sort: LearnerCourseSort
) {
  const primaryOrder =
    sort === "title-desc" || sort === "lesson-count-desc"
      ? desc(primary)
      : asc(primary)
  return [primaryOrder, asc(courseId)] as const
}

function toCourseCursorCondition(
  courseList: ReturnType<typeof createCourseListSubquery>,
  sort: LearnerCourseSort,
  after: LearnerCourseListRepositoryQuery["after"]
) {
  if (after === undefined) return undefined

  switch (sort) {
    case "recommended":
      return typeof after.primary !== "number"
        ? sql`0`
        : or(
            gt(courseList.sortOrder, after.primary),
            and(
              eq(courseList.sortOrder, after.primary),
              gt(courseList.id, after.courseId)
            )
          )
    case "title-asc":
    case "title-desc": {
      if (typeof after.primary !== "string") return sql`0`
      const comparison =
        sort === "title-desc"
          ? lt(courseList.titleSortKey, after.primary)
          : gt(courseList.titleSortKey, after.primary)
      return or(
        comparison,
        and(
          eq(courseList.titleSortKey, after.primary),
          gt(courseList.id, after.courseId)
        )
      )
    }
    case "lesson-count-asc":
    case "lesson-count-desc": {
      if (typeof after.primary !== "number") return sql`0`
      const comparison =
        sort === "lesson-count-desc"
          ? lt(courseList.lessonCount, after.primary)
          : gt(courseList.lessonCount, after.primary)
      return or(
        comparison,
        and(
          eq(courseList.lessonCount, after.primary),
          gt(courseList.id, after.courseId)
        )
      )
    }
  }
}

function readCoursePrimary(
  row: {
    readonly lessonCount: number
    readonly sortOrder: number
    readonly titleSortKey: string
  },
  sort: LearnerCourseSort
): number | string {
  switch (sort) {
    case "recommended":
      return row.sortOrder
    case "title-asc":
    case "title-desc":
      return row.titleSortKey
    case "lesson-count-asc":
    case "lesson-count-desc":
      return row.lessonCount
  }
}

function listCourseCategories(db: WritingAppDatabase): readonly string[] {
  return [
    ...new Set(
      db
        .selectDistinct({ category: courseCurriculumVersions.category })
        .from(courses)
        .innerJoin(
          courseCurriculumVersions,
          eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
        )
        .where(eq(courses.status, activeStatus))
        .all()
        .map((row) => row.category.normalize("NFC"))
    ),
  ].sort((left, right) => left.localeCompare(right, "ko"))
}

function findCourseDetail(
  db: WritingAppDatabase,
  { courseId, userId }: { readonly courseId: string; readonly userId: string }
): LearnerCourseDetail | null {
  const course = db.select().from(courses).where(eq(courses.id, courseId)).get()
  if (course === undefined) return null

  const courseProgress = db
    .select()
    .from(learnerCourseProgress)
    .where(
      and(
        eq(learnerCourseProgress.userId, userId),
        eq(learnerCourseProgress.courseId, courseId)
      )
    )
    .get()

  if (courseProgress === undefined && course.status !== activeStatus)
    return null

  const versionId =
    courseProgress?.curriculumVersionId ?? course.publishedCurriculumVersionId
  if (versionId === null) return null

  const version = db
    .select()
    .from(courseCurriculumVersions)
    .where(eq(courseCurriculumVersions.id, versionId))
    .get()
  if (version === undefined) return null

  const units = db
    .select()
    .from(courseUnitVersions)
    .where(
      and(
        eq(courseUnitVersions.curriculumVersionId, versionId),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .orderBy(asc(courseUnitVersions.sortOrder))
    .all()
  const lessons = db
    .select(getTableColumns(lessonVersions))
    .from(lessonVersions)
    .innerJoin(
      courseUnitVersions,
      and(
        eq(
          courseUnitVersions.curriculumVersionId,
          lessonVersions.curriculumVersionId
        ),
        eq(courseUnitVersions.id, lessonVersions.unitId),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, versionId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .orderBy(
      asc(courseUnitVersions.sortOrder),
      asc(lessonVersions.sortOrder),
      asc(lessonVersions.id)
    )
    .all()
  const steps = db
    .select({
      id: lessonStepVersions.id,
      lessonId: lessonStepVersions.lessonId,
      sortOrder: lessonStepVersions.sortOrder,
    })
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, versionId),
        eq(lessonStepVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .all()
  const progressRows = db
    .select()
    .from(learnerLessonProgress)
    .where(
      and(
        eq(learnerLessonProgress.userId, userId),
        eq(learnerLessonProgress.curriculumVersionId, versionId)
      )
    )
    .all()
  const versionRef = curriculumVersionRefSchema.parse({
    curriculumVersionId: version.id,
    revision: version.revision,
  })
  const stepsByLessonId = new Map<string, typeof steps>()
  for (const step of steps) {
    const lessonSteps = stepsByLessonId.get(step.lessonId) ?? []
    stepsByLessonId.set(step.lessonId, [...lessonSteps, step])
  }
  const progressByLessonId = new Map(
    progressRows.map((progress) => [progress.lessonId, progress])
  )
  const firstIncompleteLesson = lessons.find(
    (lesson) => progressByLessonId.get(lesson.id)?.status !== "completed"
  )
  const lessonLearning = new Map<string, LessonLearningState>(
    lessons.map((lesson) => {
      const lessonSteps = stepsByLessonId.get(lesson.id) ?? []
      const progress = progressByLessonId.get(lesson.id)

      return [
        lesson.id,
        createLessonLearningState({
          isFirstIncomplete: lesson.id === firstIncompleteLesson?.id,
          progress,
          steps: lessonSteps,
          version: versionRef,
        }),
      ]
    })
  )
  const learning = createCourseLearningState({
    courseProgress,
    lessonLearning,
    lessons,
    stepsByLessonId,
    version: versionRef,
  })

  return learnerCourseDetailSchema.parse({
    category: version.category,
    contentStatus: course.status,
    description: version.description,
    id: course.id,
    learning,
    lessonCount: lessons.length,
    title: version.title,
    units: units.map((unit) => ({
      id: unit.id,
      lessons: lessons
        .filter((lesson) => lesson.unitId === unit.id)
        .map((lesson) => ({
          category: lesson.category,
          contentStatus: lesson.status,
          description: lesson.description,
          estimatedMinutes: lesson.estimatedMinutes,
          id: lesson.id,
          learning: lessonLearning.get(lesson.id),
          sortOrder: lesson.sortOrder,
          title: lesson.title,
        })),
      sortOrder: unit.sortOrder,
      title: unit.title,
    })),
    version: versionRef,
    visualKey: version.visualKey,
  })
}

function createLessonLearningState({
  isFirstIncomplete,
  progress,
  steps,
  version,
}: {
  readonly isFirstIncomplete: boolean
  readonly progress: typeof learnerLessonProgress.$inferSelect | undefined
  readonly steps: readonly {
    readonly id: string
    readonly sortOrder: number
  }[]
  readonly version: {
    readonly curriculumVersionId: CourseLearningState["version"]["curriculumVersionId"]
    readonly revision: number
  }
}): LessonLearningState {
  if (progress?.status === "completed") {
    return lessonLearningStateSchema.parse({
      completion: {
        completedAt: toIso(progress.completedAt ?? progress.updatedAt),
        totalSteps: steps.length,
      },
      status: "completed",
      version,
    })
  }

  if (!isFirstIncomplete) {
    return lessonLearningStateSchema.parse({ status: "locked", version })
  }

  if (progress === undefined) {
    return lessonLearningStateSchema.parse({
      status: "not_started",
      totalSteps: steps.length,
      version,
    })
  }

  const currentStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === progress.currentStepId)
  )

  return lessonLearningStateSchema.parse({
    completedSteps: currentStepIndex,
    currentStepId: progress.currentStepId,
    currentStepIndex,
    progressPercent:
      steps.length === 0
        ? 0
        : Math.round((currentStepIndex / steps.length) * 100),
    status: "in_progress",
    totalSteps: steps.length,
    version,
  })
}

function createCourseLearningState({
  courseProgress,
  lessonLearning,
  lessons,
  stepsByLessonId,
  version,
}: {
  readonly courseProgress: typeof learnerCourseProgress.$inferSelect | undefined
  readonly lessonLearning: ReadonlyMap<string, LessonLearningState>
  readonly lessons: readonly (typeof lessonVersions.$inferSelect)[]
  readonly stepsByLessonId: ReadonlyMap<
    string,
    readonly { readonly id: string; readonly sortOrder: number }[]
  >
  readonly version: {
    readonly curriculumVersionId: CourseLearningState["version"]["curriculumVersionId"]
    readonly revision: number
  }
}): CourseLearningState {
  const completedLessons = lessons.filter(
    (lesson) => lessonLearning.get(lesson.id)?.status === "completed"
  ).length
  const totalLessons = lessons.length

  if (courseProgress?.status === "completed") {
    return courseLearningStateSchema.parse({
      completedAt: toIso(
        courseProgress.completedAt ?? courseProgress.lastActivityAt
      ),
      completedLessons,
      lastActivityAt: toIso(courseProgress.lastActivityAt),
      nextLesson: null,
      progressPercent: 100,
      status: "completed",
      totalLessons,
      version,
    })
  }

  const nextLesson = lessons.find(
    (lesson) => lessonLearning.get(lesson.id)?.status !== "completed"
  )
  if (nextLesson === undefined) {
    throw new Error("In-progress curriculum must have a next lesson")
  }
  const nextLearning = lessonLearning.get(nextLesson.id)
  const steps = stepsByLessonId.get(nextLesson.id) ?? []
  const currentStepIndex =
    nextLearning?.status === "in_progress" ? nextLearning.currentStepIndex : 0
  const currentStepId =
    nextLearning?.status === "in_progress"
      ? nextLearning.currentStepId
      : steps[0]?.id
  if (currentStepId === undefined) {
    throw new Error("Published lesson must have at least one step")
  }
  const nextLessonReference = {
    currentStepId,
    currentStepIndex,
    estimatedMinutes: nextLesson.estimatedMinutes,
    id: nextLesson.id,
    title: nextLesson.title,
  }

  if (courseProgress === undefined) {
    return courseLearningStateSchema.parse({
      completedLessons: 0,
      nextLesson: nextLessonReference,
      progressPercent: 0,
      status: "not_started",
      totalLessons,
      version,
    })
  }

  return courseLearningStateSchema.parse({
    completedLessons,
    lastActivityAt: toIso(courseProgress.lastActivityAt),
    nextLesson: nextLessonReference,
    progressPercent:
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100),
    status: "in_progress",
    totalLessons,
    version,
  })
}

function findLesson(
  db: WritingAppDatabase,
  { lessonId, userId }: { readonly lessonId: string; readonly userId: string },
  presentationSecret: string
) {
  const pinnedCourse = db
    .select({ courseId: learnerCourseProgress.courseId })
    .from(learnerCourseProgress)
    .innerJoin(
      lessonVersions,
      and(
        eq(
          lessonVersions.curriculumVersionId,
          learnerCourseProgress.curriculumVersionId
        ),
        eq(lessonVersions.id, lessonId)
      )
    )
    .where(eq(learnerCourseProgress.userId, userId))
    .get()
  const currentCourse =
    pinnedCourse ??
    db
      .select({ courseId: courses.id })
      .from(courses)
      .innerJoin(
        lessonVersions,
        and(
          eq(
            lessonVersions.curriculumVersionId,
            courses.publishedCurriculumVersionId
          ),
          eq(lessonVersions.id, lessonId)
        )
      )
      .where(eq(courses.status, activeStatus))
      .get()

  if (currentCourse === undefined) return { kind: "not-found" as const }
  const course = findCourseDetail(db, {
    courseId: currentCourse.courseId,
    userId,
  })
  if (course === null) return { kind: "not-found" as const }
  const lessonSummary = course.units
    .flatMap((unit) => unit.lessons)
    .find((lesson) => lesson.id === lessonId)
  if (lessonSummary === undefined) return { kind: "not-found" as const }
  if (lessonSummary.learning.status === "locked") {
    return { kind: "locked" as const }
  }

  const lesson = db
    .select()
    .from(lessonVersions)
    .where(
      and(
        eq(
          lessonVersions.curriculumVersionId,
          course.version.curriculumVersionId
        ),
        eq(lessonVersions.id, lessonId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .get()
  if (lesson === undefined) return { kind: "not-found" as const }

  const learnerScope = createHmac("sha256", presentationSecret)
    .update(`presentation:${userId}`)
    .digest("base64url")
  const steps = db
    .select()
    .from(lessonStepVersions)
    .where(
      and(
        eq(
          lessonStepVersions.curriculumVersionId,
          course.version.curriculumVersionId
        ),
        eq(lessonStepVersions.lessonId, lessonId),
        eq(lessonStepVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .all()
    .map(toInternalLessonStep)
    .map((step) =>
      presentLearnerStep(step, {
        learnerScope,
        lessonId,
        versionId: course.version.curriculumVersionId,
      })
    )

  return {
    kind: "found" as const,
    value: learnerLessonSchema.parse({
      category: lesson.category,
      courseId: course.id,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      id: lesson.id,
      learning: lessonSummary.learning,
      steps,
      summary: lessonSummarySchema.parse(JSON.parse(lesson.summaryJson)),
      title: lesson.title,
      unitId: lesson.unitId,
      version: course.version,
    }),
  }
}

function toInternalLessonStep(
  row: typeof lessonStepVersions.$inferSelect
): LessonStepDto {
  const parsed = rawStepContentSchema.parse(JSON.parse(row.contentJson))
  const { type: _sourceType, ...content } = parsed
  return lessonStepDtoSchema.parse({
    ...content,
    id: row.id,
    sortOrder: row.sortOrder,
    type: row.type,
  })
}

function presentLearnerStep(
  step: LessonStepDto,
  scope: {
    readonly learnerScope: string
    readonly lessonId: string
    readonly versionId: string
  }
): LearnerLessonStep {
  const base = { id: step.id, sortOrder: step.sortOrder }
  const order = <T extends { readonly id: string }>(items: readonly T[]) =>
    deterministicOrder(
      items,
      `${scope.learnerScope}:${scope.versionId}:${scope.lessonId}:${step.id}`
    )

  switch (step.type) {
    case "READING":
      return learnerLessonStepSchema.parse({
        ...base,
        body: step.body,
        guide: step.guide,
        source: step.source,
        title: step.title,
        type: step.type,
      })
    case "COMPARE":
      return learnerLessonStepSchema.parse({
        ...base,
        title: step.title,
        type: step.type,
        versions: step.versions,
      })
    case "MULTIPLE_CHOICE":
      return learnerLessonStepSchema.parse({
        ...base,
        options: order(step.options),
        question: step.question,
        type: step.type,
      })
    case "FILL_BLANK":
      return learnerLessonStepSchema.parse({
        ...base,
        blankCount: step.answer.length,
        choices: order(
          step.words.map((text, index) => ({
            id: requireItemId(step.wordIds?.[index], step.id, "word", index),
            text,
          }))
        ),
        template: step.template,
        type: step.type,
      })
    case "SELECT":
      return learnerLessonStepSchema.parse({
        ...base,
        items: step.segments.map((text, index) => ({
          id: requireItemId(
            step.segmentIds?.[index],
            step.id,
            "segment",
            index
          ),
          text,
        })),
        layout: step.layout,
        question: step.question,
        type: step.type,
      })
    case "ORDER":
      return learnerLessonStepSchema.parse({
        ...base,
        items: order(
          step.items.map((text, index) => ({
            id: requireItemId(step.itemIds?.[index], step.id, "item", index),
            text,
          }))
        ),
        showNumbers: step.showNumbers,
        title: step.title,
        type: step.type,
      })
    case "WRITE":
      return learnerLessonStepSchema.parse({
        ...base,
        badge: step.badge,
        claim: step.claim,
        context: step.context,
        draft: step.draft,
        goal: step.goal,
        guide: step.guide,
        max: step.max,
        min: step.min,
        mode: step.mode,
        placeholder: step.placeholder,
        prompt: step.prompt,
        reference: step.reference,
        sample: step.sample,
        structure: step.structure,
        title: step.title,
        topic: step.topic,
        type: step.type,
      })
    case "AI_FEEDBACK":
      return learnerLessonStepSchema.parse({
        ...base,
        focus: step.focus,
        target: step.target,
        type: step.type,
      })
    case "MATCH":
      return learnerLessonStepSchema.parse({
        ...base,
        guide: step.guide,
        leftItems: order(
          step.pairs.map((pair, index) => ({
            id: requireItemId(pair.leftId, step.id, "left", index),
            text: pair.left,
          }))
        ),
        rightItems: order(
          step.pairs.map((pair, index) => ({
            id: requireItemId(pair.rightId, step.id, "right", index),
            text: pair.right,
          }))
        ),
        title: step.title,
        type: step.type,
      })
    case "CATEGORIZE":
      return learnerLessonStepSchema.parse({
        ...base,
        categories: order(
          step.categories.map((category) => ({
            id: category.id,
            text: category.label,
          }))
        ),
        guide: step.guide,
        items: order(
          step.items.map((item) => ({ id: item.id, text: item.text }))
        ),
        title: step.title,
        type: step.type,
      })
  }
}

function deterministicOrder<T extends { readonly id: string }>(
  items: readonly T[],
  scope: string
): readonly T[] {
  return [...items].sort((left, right) => {
    const leftKey = createHmac("sha256", scope).update(left.id).digest("hex")
    const rightKey = createHmac("sha256", scope).update(right.id).digest("hex")
    return leftKey.localeCompare(rightKey) || left.id.localeCompare(right.id)
  })
}

function requireItemId(
  value: string | undefined,
  stepId: string,
  kind: string,
  index: number
): string {
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing stable ${kind} ID for ${stepId} at ${index}`)
  }
  return value
}

function listProgress(
  db: WritingAppDatabase,
  query: LearnerProgressListRepositoryQuery
) {
  const afterDate =
    query.after === undefined || typeof query.after.primary !== "number"
      ? undefined
      : new Date(query.after.primary)
  const rows = db
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
          : eq(learnerCourseProgress.status, query.status),
        afterDate === undefined || query.after === undefined
          ? undefined
          : or(
              lt(learnerCourseProgress.lastActivityAt, afterDate),
              and(
                eq(learnerCourseProgress.lastActivityAt, afterDate),
                gt(learnerCourseProgress.courseId, query.after.courseId)
              )
            )
      )
    )
    .orderBy(
      desc(learnerCourseProgress.lastActivityAt),
      asc(learnerCourseProgress.courseId)
    )
    .limit(query.limit + 1)
    .all()
  const pageRows = rows.slice(0, query.limit)
  const items = pageRows.map((row) => {
    const course = findCourseDetail(db, {
      courseId: row.courseId,
      userId: query.userId,
    })
    if (course === null) {
      throw new Error(`Pinned learner course is missing: ${row.courseId}`)
    }
    return learnerProgressCourseSchema.parse({
      id: course.id,
      learning: course.learning,
      title: course.title,
      visualKey: course.visualKey,
    })
  })
  const lastRow = rows.length > query.limit ? pageRows.at(-1) : undefined

  return {
    items,
    nextPosition:
      lastRow === undefined
        ? null
        : {
            courseId: lastRow.courseId,
            primary: lastRow.lastActivityAt.getTime(),
          },
  }
}

function toIso(value: Date): string {
  return value.toISOString()
}

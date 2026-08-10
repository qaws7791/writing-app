import { createHmac } from "node:crypto"

import type {
  CurriculumVersionId,
  LessonId,
  LessonStepId,
} from "@workspace/types/ids"

import type {
  LearnerCourseDetail,
  LearnerCourseSummary,
  LearnerContentAssetReference,
  LearnerCursorPosition,
  LearnerLessonStep,
  LearnerProgressCourse,
} from "#learning/application/learning-read-model"
import type {
  CourseLearningState,
  CurriculumVersionRef,
  LessonLearningState,
  LearningStep,
} from "#learning/domain/learning-types"

export type LearnerCourseListProjectionRow = {
  readonly category: string
  readonly contentStatus: LearnerCourseDetail["contentStatus"]
  readonly cover: LearnerContentAssetReference | null
  readonly description: string
  readonly id: string
  readonly lessonCount: number
  readonly revision: number
  readonly sortOrder: number
  readonly title: string
  readonly versionId: string
  readonly visualKey: LearnerCourseDetail["visualKey"]
}

type LearnerCourseProjectionLesson = {
  readonly category: string | null
  readonly contentStatus: LearnerCourseDetail["contentStatus"]
  readonly description: string | null
  readonly estimatedMinutes: number
  readonly id: string
  readonly sortOrder: number
  readonly title: string
  readonly unitId: string
}

type LearnerCourseProjectionStep = {
  readonly id: string
  readonly lessonId: string
  readonly sortOrder: number
}

type LearnerCourseProgressProjectionRow = {
  readonly completedAt: Date | null
  readonly lastActivityAt: Date
  readonly status: "completed" | "in_progress"
}

type LearnerLessonProgressProjectionRow = {
  readonly completedAt: Date | null
  readonly currentStepId: string
  readonly lessonId: string
  readonly status: "completed" | "in_progress"
  readonly updatedAt: Date
}

export type LearnerCourseProjectionBundle = {
  readonly course: {
    readonly contentStatus: LearnerCourseDetail["contentStatus"]
    readonly id: string
  }
  readonly courseProgress: LearnerCourseProgressProjectionRow | undefined
  readonly lessonProgress: readonly LearnerLessonProgressProjectionRow[]
  readonly lessons: readonly LearnerCourseProjectionLesson[]
  readonly steps: readonly LearnerCourseProjectionStep[]
  readonly units: readonly {
    readonly id: string
    readonly sortOrder: number
    readonly title: string
  }[]
  readonly version: {
    readonly category: string
    readonly cover: LearnerContentAssetReference | null
    readonly description: string
    readonly id: string
    readonly revision: number
    readonly title: string
    readonly visualKey: LearnerCourseDetail["visualKey"]
  }
}

export type LearnerProgressPageProjectionRow = {
  readonly courseId: string
  readonly lastActivityAt: Date
}

export function projectLearnerCoursePage(input: {
  readonly limit: number
  readonly rows: readonly LearnerCourseListProjectionRow[]
}) {
  const pageRows = input.rows.slice(0, input.limit)
  const items: readonly LearnerCourseSummary[] = pageRows.map((row) => ({
    category: row.category,
    contentStatus: row.contentStatus,
    cover: row.cover,
    description: row.description,
    id: row.id,
    lessonCount: row.lessonCount,
    title: row.title,
    version: {
      curriculumVersionId: row.versionId,
      revision: row.revision,
    },
    visualKey: row.visualKey,
  }))
  const lastRow = input.rows.length > input.limit ? pageRows.at(-1) : undefined
  const nextPosition: LearnerCursorPosition | null =
    lastRow === undefined
      ? null
      : {
          courseId: lastRow.id,
          primary: lastRow.sortOrder,
        }

  return { items, nextPosition }
}

export function projectLearnerProgressPageWindow(
  rows: readonly LearnerProgressPageProjectionRow[],
  limit: number
): {
  readonly nextPosition: LearnerCursorPosition | null
  readonly pageRows: readonly LearnerProgressPageProjectionRow[]
} {
  const pageRows = rows.slice(0, limit)
  const lastRow = rows.length > limit ? pageRows.at(-1) : undefined

  return {
    nextPosition:
      lastRow === undefined
        ? null
        : {
            courseId: lastRow.courseId,
            primary: lastRow.lastActivityAt.getTime(),
          },
    pageRows,
  }
}

export function projectLearnerProgressCourse(
  course: LearnerCourseDetail
): LearnerProgressCourse {
  return {
    cover: course.cover,
    id: course.id,
    learning: course.learning,
    title: course.title,
    visualKey: course.visualKey,
  }
}

export function projectLearnerCourseDetail(
  bundle: LearnerCourseProjectionBundle
): LearnerCourseDetail {
  const version: CurriculumVersionRef = {
    curriculumVersionId: bundle.version.id as CurriculumVersionId,
    revision: bundle.version.revision,
  }
  const stepsByLessonId = groupStepsByLessonId(bundle.steps)
  const progressByLessonId = new Map(
    bundle.lessonProgress.map((progress) => [progress.lessonId, progress])
  )
  const lessonLearning = new Map<string, LessonLearningState>(
    bundle.lessons.map((lesson) => {
      const steps = stepsByLessonId.get(lesson.id) ?? []
      const progress = progressByLessonId.get(lesson.id)

      return [
        lesson.id,
        projectLearnerLessonLearningState({
          progress,
          steps,
          version,
        }),
      ]
    })
  )
  const learning = projectLearnerCourseLearningState({
    courseProgress: bundle.courseProgress,
    lessonLearning,
    lessons: bundle.lessons,
    stepsByLessonId,
    version,
  })

  return {
    category: bundle.version.category,
    contentStatus: bundle.course.contentStatus,
    cover: bundle.version.cover,
    description: bundle.version.description,
    id: bundle.course.id,
    learning,
    lessonCount: bundle.lessons.length,
    title: bundle.version.title,
    units: bundle.units.map((unit) => ({
      id: unit.id,
      lessons: bundle.lessons
        .filter((lesson) => lesson.unitId === unit.id)
        .map((lesson) => ({
          category: lesson.category,
          contentStatus: lesson.contentStatus,
          description: lesson.description,
          estimatedMinutes: lesson.estimatedMinutes,
          id: lesson.id,
          learning: requireLessonLearning(lessonLearning, lesson.id),
          sortOrder: lesson.sortOrder,
          title: lesson.title,
        })),
      sortOrder: unit.sortOrder,
      title: unit.title,
    })),
    version,
    visualKey: bundle.version.visualKey,
  }
}

function projectLearnerLessonLearningState(input: {
  readonly progress: LearnerLessonProgressProjectionRow | undefined
  readonly steps: readonly LearnerCourseProjectionStep[]
  readonly version: CurriculumVersionRef
}): LessonLearningState {
  if (input.progress?.status === "completed") {
    return {
      completion: {
        completedAt: toIso(
          input.progress.completedAt ?? input.progress.updatedAt
        ),
        totalSteps: input.steps.length,
      },
      status: "completed",
      version: input.version,
    }
  }

  if (input.progress === undefined) {
    return {
      status: "not_started",
      totalSteps: input.steps.length,
      version: input.version,
    }
  }

  const currentStepIndex = Math.max(
    0,
    input.steps.findIndex((step) => step.id === input.progress?.currentStepId)
  )

  return {
    completedSteps: currentStepIndex,
    currentStepId: input.progress.currentStepId as LessonStepId,
    currentStepIndex,
    progressPercent:
      input.steps.length === 0
        ? 0
        : Math.round((currentStepIndex / input.steps.length) * 100),
    status: "in_progress",
    totalSteps: input.steps.length,
    version: input.version,
  }
}

function projectLearnerCourseLearningState(input: {
  readonly courseProgress: LearnerCourseProgressProjectionRow | undefined
  readonly lessonLearning: ReadonlyMap<string, LessonLearningState>
  readonly lessons: readonly LearnerCourseProjectionLesson[]
  readonly stepsByLessonId: ReadonlyMap<
    string,
    readonly LearnerCourseProjectionStep[]
  >
  readonly version: CurriculumVersionRef
}): CourseLearningState {
  const completedLessons = input.lessons.filter(
    (lesson) => input.lessonLearning.get(lesson.id)?.status === "completed"
  ).length
  const totalLessons = input.lessons.length

  if (input.courseProgress?.status === "completed") {
    return {
      completedAt: toIso(
        input.courseProgress.completedAt ?? input.courseProgress.lastActivityAt
      ),
      completedLessons,
      lastActivityAt: toIso(input.courseProgress.lastActivityAt),
      nextLesson: null,
      progressPercent: 100,
      status: "completed",
      totalLessons,
      version: input.version,
    }
  }

  const nextLesson = input.lessons.find(
    (lesson) => input.lessonLearning.get(lesson.id)?.status !== "completed"
  )
  if (nextLesson === undefined) {
    throw new Error("In-progress curriculum must have a next lesson")
  }
  const nextLearning = input.lessonLearning.get(nextLesson.id)
  const steps = input.stepsByLessonId.get(nextLesson.id) ?? []
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
    currentStepId: currentStepId as LessonStepId,
    currentStepIndex,
    estimatedMinutes: nextLesson.estimatedMinutes,
    id: nextLesson.id as LessonId,
    title: nextLesson.title,
  }

  if (input.courseProgress === undefined) {
    return {
      completedLessons: 0,
      nextLesson: nextLessonReference,
      progressPercent: 0,
      status: "not_started",
      totalLessons,
      version: input.version,
    }
  }

  return {
    completedLessons,
    lastActivityAt: toIso(input.courseProgress.lastActivityAt),
    nextLesson: nextLessonReference,
    progressPercent:
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100),
    status: "in_progress",
    totalLessons,
    version: input.version,
  }
}

function requireLessonLearning(
  learningByLessonId: ReadonlyMap<string, LessonLearningState>,
  lessonId: string
): LessonLearningState {
  const learning = learningByLessonId.get(lessonId)
  if (learning === undefined) {
    throw new Error(`Projected lesson learning is missing: ${lessonId}`)
  }
  return learning
}

function groupStepsByLessonId(
  steps: readonly LearnerCourseProjectionStep[]
): ReadonlyMap<string, readonly LearnerCourseProjectionStep[]> {
  const stepsByLessonId = new Map<
    string,
    readonly LearnerCourseProjectionStep[]
  >()

  for (const step of steps) {
    const lessonSteps = stepsByLessonId.get(step.lessonId) ?? []
    stepsByLessonId.set(step.lessonId, [...lessonSteps, step])
  }

  return stepsByLessonId
}

function toIso(value: Date): string {
  return value.toISOString()
}

export type LearnerStepPresentationContext = {
  readonly assetReferencesById?: ReadonlyMap<
    string,
    LearnerContentAssetReference
  >
  readonly learnerScope: string
  readonly lessonId: string
  readonly versionId: string
}

/**
 * 내부 학습 단계를 학습자 공개 허용 목록으로 투영한다.
 * 각 variant는 중첩 값까지 공개 필드만 새 객체로 구성한다.
 */
export function presentLearnerStep(
  step: LearningStep,
  context: LearnerStepPresentationContext
): LearnerLessonStep {
  const order = <T extends { readonly id: string }>(items: readonly T[]) =>
    orderLearnerStepItems(items, createPresentationScope(step, context))

  switch (step.type) {
    case "READING":
      return {
        body: step.body,
        guide: step.guide,
        id: step.id,
        ...(step.illustrationAssetId === undefined
          ? {}
          : {
              illustration: requireContentAssetReference(
                context.assetReferencesById,
                step.illustrationAssetId,
                "reading-illustration"
              ),
            }),
        sortOrder: step.sortOrder,
        source: step.source,
        title: step.title,
        type: "READING",
      }
    case "COMPARE":
      return {
        id: step.id,
        sortOrder: step.sortOrder,
        title: step.title,
        type: "COMPARE",
        versions: step.versions.map((version) => ({
          label: version.label,
          text: version.text,
        })),
      }
    case "MULTIPLE_CHOICE":
      return {
        id: step.id,
        options: order(
          step.options.map((option) => ({
            id: option.id,
            text: option.text,
          }))
        ),
        question: step.question,
        sortOrder: step.sortOrder,
        type: "MULTIPLE_CHOICE",
      }
    case "FILL_BLANK":
      return {
        blankCount: step.answer.length,
        choices: order(
          step.words.map((text, index) => ({
            id: requireParallelItemId(step.wordIds, index, step.id),
            text,
          }))
        ),
        id: step.id,
        sortOrder: step.sortOrder,
        template: step.template,
        type: "FILL_BLANK",
      }
    case "SELECT":
      return {
        id: step.id,
        items: step.segments.map((text, index) => ({
          id: requireParallelItemId(step.segmentIds, index, step.id),
          text,
        })),
        layout: step.layout,
        question: step.question,
        sortOrder: step.sortOrder,
        type: "SELECT",
      }
    case "ORDER":
      return {
        id: step.id,
        items: order(
          step.items.map((text, index) => ({
            id: requireParallelItemId(step.itemIds, index, step.id),
            text,
          }))
        ),
        showNumbers: step.showNumbers,
        sortOrder: step.sortOrder,
        title: step.title,
        type: "ORDER",
      }
    case "WRITE":
      return {
        badge: step.badge,
        claim: step.claim,
        context: step.context,
        draft: step.draft,
        goal: step.goal,
        guide: step.guide,
        id: step.id,
        max: step.max,
        min: step.min,
        mode: step.mode,
        placeholder: step.placeholder,
        prompt: step.prompt,
        reference: step.reference,
        sample: step.sample,
        sortOrder: step.sortOrder,
        structure: step.structure,
        title: step.title,
        topic: step.topic,
        type: "WRITE",
      }
    case "AI_FEEDBACK":
      return {
        focus: step.focus,
        id: step.id,
        sortOrder: step.sortOrder,
        target: step.target,
        type: "AI_FEEDBACK",
      }
    case "MATCH":
      return {
        guide: step.guide,
        id: step.id,
        leftItems: order(
          step.pairs.map((pair) => ({
            id: pair.leftId,
            text: pair.left,
          }))
        ),
        rightItems: order(
          step.pairs.map((pair) => ({
            id: pair.rightId,
            text: pair.right,
          }))
        ),
        sortOrder: step.sortOrder,
        title: step.title,
        type: "MATCH",
      }
    case "CATEGORIZE":
      return {
        categories: order(
          step.categories.map((category) => ({
            id: category.id,
            text: category.label,
          }))
        ),
        guide: step.guide,
        id: step.id,
        items: order(
          step.items.map((item) => ({
            id: item.id,
            text: item.text,
          }))
        ),
        sortOrder: step.sortOrder,
        title: step.title,
        type: "CATEGORIZE",
      }
  }

  return assertNever(step)
}

function requireContentAssetReference(
  references: ReadonlyMap<string, LearnerContentAssetReference> | undefined,
  assetId: string,
  expectedKind: LearnerContentAssetReference["kind"]
): LearnerContentAssetReference {
  const reference = references?.get(assetId)
  if (reference === undefined || reference.kind !== expectedKind) {
    throw new Error(`Published content asset is missing: ${assetId}`)
  }
  return reference
}

function createPresentationScope(
  step: LearningStep,
  context: LearnerStepPresentationContext
): string {
  return `${context.learnerScope}:${context.versionId}:${context.lessonId}:${step.id}`
}

function orderLearnerStepItems<T extends { readonly id: string }>(
  items: readonly T[],
  scope: string
): readonly T[] {
  return Array.from(items).sort((left, right) => {
    const leftKey = createHmac("sha256", scope).update(left.id).digest("hex")
    const rightKey = createHmac("sha256", scope).update(right.id).digest("hex")
    return leftKey.localeCompare(rightKey) || left.id.localeCompare(right.id)
  })
}

function requireParallelItemId(
  ids: readonly string[],
  index: number,
  stepId: string
): string {
  const id = ids[index]
  if (id === undefined) {
    throw new Error(`Missing stable item ID for ${stepId} at ${index}`)
  }
  return id
}

function assertNever(value: never): never {
  throw new Error(`Unsupported learner step: ${String(value)}`)
}

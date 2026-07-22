import { lessonStepDtoSchema } from "@workspace/contracts/content/course"
import type {
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/types/ids"

import type { LearningCurriculum } from "#learning/domain/learning-types"

export type PersistedPublishedCurriculum = Readonly<{
  category: string
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  description: string
  revision: number
  title: string
  units: readonly Readonly<{
    id: UnitId
    lessons: readonly Readonly<{
      category: string | null
      description: string | null
      estimatedMinutes: number
      id: LessonId
      sortOrder: number
      status: "active" | "archived"
      steps: readonly Readonly<{
        contentJson: string
        id: LessonStepId
        sortOrder: number
        type: string
      }>[]
      summary: readonly string[]
      title: string
    }>[]
    sortOrder: number
    status: "active" | "archived"
    title: string
  }>[]
  visualKey: LearningCurriculum["visualKey"]
}>

export function mapPublishedLearningCurriculum(
  curriculum: PersistedPublishedCurriculum,
  contentStatus: "active" | "archived"
): LearningCurriculum {
  return Object.freeze({
    category: curriculum.category,
    contentStatus,
    courseId: curriculum.courseId,
    curriculumVersionId: curriculum.curriculumVersionId,
    description: curriculum.description,
    lessons: Object.freeze(
      curriculum.units.flatMap((unit) =>
        unit.lessons.map((lesson) =>
          Object.freeze({
            category: lesson.category,
            description: lesson.description,
            estimatedMinutes: lesson.estimatedMinutes,
            id: lesson.id,
            sortOrder: lesson.sortOrder,
            status: lesson.status,
            steps: Object.freeze(lesson.steps.map(mapPersistedLearningStep)),
            summary: Object.freeze([...lesson.summary]),
            title: lesson.title,
            unitId: unit.id,
            unitSortOrder: unit.sortOrder,
          })
        )
      )
    ),
    revision: curriculum.revision,
    title: curriculum.title,
    units: Object.freeze(
      curriculum.units.map((unit) =>
        Object.freeze({
          id: unit.id,
          sortOrder: unit.sortOrder,
          status: unit.status,
          title: unit.title,
        })
      )
    ),
    visualKey: curriculum.visualKey,
  })
}

function mapPersistedLearningStep(
  step: PersistedPublishedCurriculum["units"][number]["lessons"][number]["steps"][number]
) {
  let value: unknown
  try {
    value = JSON.parse(step.contentJson) as unknown
  } catch {
    throw new Error(`Published learning step JSON is invalid: ${step.id}`)
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Published learning step content is invalid: ${step.id}`)
  }
  const { type: _persistedType, ...content } = value as Record<string, unknown>
  return lessonStepDtoSchema.parse({
    ...content,
    id: step.id,
    sortOrder: step.sortOrder,
    type: step.type,
  })
}

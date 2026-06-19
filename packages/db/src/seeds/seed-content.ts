import {
  persistedContentStatuses,
  type PersistedContentStatus,
  type PersistedCourseVisualKey,
} from "@workspace/db/persisted-values"

export type ContentSeedStepType =
  | "reading"
  | "compare"
  | "multiple_choice"
  | "fill_blank"
  | "select"
  | "order"
  | "write"
  | "ai_feedback"
  | "match"
  | "categorize"

export type StandardLessonStepType =
  | "READING"
  | "COMPARE"
  | "MULTIPLE_CHOICE"
  | "FILL_BLANK"
  | "SELECT"
  | "ORDER"
  | "WRITE"
  | "AI_FEEDBACK"
  | "MATCH"
  | "CATEGORIZE"

export type ContentSeedStep = {
  readonly type: ContentSeedStepType
}

export type ContentSeedLesson = {
  readonly id: string
  readonly title: string
  readonly time: string
  readonly cat?: string
  readonly desc?: string
  readonly summary?: readonly string[]
  readonly steps: readonly ContentSeedStep[]
}

export type ContentSeedUnit = {
  readonly id: string
  readonly title: string
  readonly lessons: readonly ContentSeedLesson[]
}

export type ContentSeedCourse = {
  readonly id: string
  readonly title: string
  readonly desc: string
  readonly cat: string
  readonly visualKey: PersistedCourseVisualKey
  readonly units: readonly ContentSeedUnit[]
}

export type CourseSeedRow = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly category: string
  readonly visualKey: PersistedCourseVisualKey
  readonly status: PersistedContentStatus
  readonly sortOrder: number
  readonly curriculumRevision: number
}

export type CourseUnitSeedRow = {
  readonly id: string
  readonly courseId: string
  readonly title: string
  readonly status: PersistedContentStatus
  readonly sortOrder: number
}

export type LessonSeedRow = {
  readonly id: string
  readonly courseId: string
  readonly unitId: string
  readonly title: string
  readonly category: string | null
  readonly description: string | null
  readonly estimatedMinutes: number
  readonly summaryJson: string
  readonly status: PersistedContentStatus
  readonly sortOrder: number
}

export type LessonStepSeedRow = {
  readonly id: string
  readonly lessonId: string
  readonly type: StandardLessonStepType
  readonly contentJson: string
  readonly status: PersistedContentStatus
  readonly sortOrder: number
}

export type ContentSeedRows = {
  readonly courses: readonly CourseSeedRow[]
  readonly units: readonly CourseUnitSeedRow[]
  readonly lessons: readonly LessonSeedRow[]
  readonly steps: readonly LessonStepSeedRow[]
}

const stepTypeMap = {
  reading: "READING",
  compare: "COMPARE",
  multiple_choice: "MULTIPLE_CHOICE",
  fill_blank: "FILL_BLANK",
  select: "SELECT",
  order: "ORDER",
  write: "WRITE",
  ai_feedback: "AI_FEEDBACK",
  match: "MATCH",
  categorize: "CATEGORIZE",
} satisfies Record<ContentSeedStepType, StandardLessonStepType>

export function toStandardLessonStepType(
  stepType: ContentSeedStepType
): StandardLessonStepType {
  return stepTypeMap[stepType]
}

export function createContentSeedRows(
  courses: readonly ContentSeedCourse[]
): ContentSeedRows {
  return {
    courses: courses.map(toCourseSeedRow),
    units: courses.flatMap(toUnitSeedRows),
    lessons: courses.flatMap(toLessonSeedRows),
    steps: courses.flatMap(toStepSeedRows),
  }
}

export function toCourseSeedRow(
  course: ContentSeedCourse,
  courseIndex: number
): CourseSeedRow {
  return {
    category: course.cat,
    curriculumRevision: 0,
    description: course.desc,
    id: course.id,
    sortOrder: courseIndex + 1,
    status: persistedContentStatuses.active,
    title: course.title,
    visualKey: course.visualKey,
  }
}

export function toUnitSeedRows(course: ContentSeedCourse): CourseUnitSeedRow[] {
  return course.units.map((unit, unitIndex) => ({
    courseId: course.id,
    id: unit.id,
    sortOrder: unitIndex + 1,
    status: persistedContentStatuses.active,
    title: unit.title,
  }))
}

export function toLessonSeedRows(course: ContentSeedCourse): LessonSeedRow[] {
  return course.units.flatMap((unit) =>
    unit.lessons.map((lesson, lessonIndex) => ({
      category: lesson.cat ?? null,
      courseId: course.id,
      description: lesson.desc ?? null,
      estimatedMinutes: parseEstimatedMinutes(lesson.time),
      id: lesson.id,
      sortOrder: lessonIndex + 1,
      status: persistedContentStatuses.active,
      summaryJson: JSON.stringify(lesson.summary ?? []),
      title: lesson.title,
      unitId: unit.id,
    }))
  )
}

export function toStepSeedRows(course: ContentSeedCourse): LessonStepSeedRow[] {
  return course.units.flatMap((unit) =>
    unit.lessons.flatMap(toLessonStepSeedRows)
  )
}

export function toLessonStepSeedRows(
  lesson: ContentSeedLesson
): LessonStepSeedRow[] {
  return lesson.steps.map((step, stepIndex) => ({
    contentJson: normalizeSeedStepContent(step),
    id: `${lesson.id}-s${stepIndex + 1}`,
    lessonId: lesson.id,
    sortOrder: stepIndex + 1,
    status: persistedContentStatuses.active,
    type: toStandardLessonStepType(step.type),
  }))
}

export function normalizeSeedStepContent(step: ContentSeedStep): string {
  return JSON.stringify(step)
}

export async function readContentSeedData(): Promise<
  readonly ContentSeedCourse[]
> {
  const seedUrl = new URL("./content-seed-data.json", import.meta.url)

  return (await Bun.file(seedUrl).json()) as readonly ContentSeedCourse[]
}

export async function createDefaultContentSeedRows(): Promise<ContentSeedRows> {
  return createContentSeedRows(await readContentSeedData())
}

function parseEstimatedMinutes(time: string): number {
  const minutes = Number.parseInt(time.replace("분", ""), 10)

  if (Number.isNaN(minutes) || minutes <= 0) {
    throw new Error(`Invalid lesson time: ${time}`)
  }

  return minutes
}

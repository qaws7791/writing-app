export type KwepStepType =
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

export type KwepStepSeed = {
  readonly type: KwepStepType
}

export type KwepLessonSeed = {
  readonly id: string
  readonly title: string
  readonly time: string
  readonly cat?: string
  readonly desc?: string
  readonly summary?: readonly string[]
  readonly steps: readonly KwepStepSeed[]
}

export type KwepUnitSeed = {
  readonly id: string
  readonly title: string
  readonly lessons: readonly KwepLessonSeed[]
}

export type KwepCourseSeed = {
  readonly id: string
  readonly title: string
  readonly desc: string
  readonly cat: string
  readonly units: readonly KwepUnitSeed[]
}

export type CourseSeedRow = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly category: string
  readonly status: "active"
  readonly sortOrder: number
  readonly curriculumRevision: number
}

export type CourseUnitSeedRow = {
  readonly id: string
  readonly courseId: string
  readonly title: string
  readonly status: "active"
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
  readonly status: "active"
  readonly sortOrder: number
}

export type LessonStepSeedRow = {
  readonly id: string
  readonly lessonId: string
  readonly type: StandardLessonStepType
  readonly contentJson: string
  readonly status: "active"
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
} satisfies Record<KwepStepType, StandardLessonStepType>

export function toStandardLessonStepType(
  stepType: KwepStepType
): StandardLessonStepType {
  return stepTypeMap[stepType]
}

export function createContentSeedRows(
  courses: readonly KwepCourseSeed[]
): ContentSeedRows {
  const courseRows: CourseSeedRow[] = []
  const unitRows: CourseUnitSeedRow[] = []
  const lessonRows: LessonSeedRow[] = []
  const stepRows: LessonStepSeedRow[] = []

  courses.forEach((course, courseIndex) => {
    courseRows.push({
      id: course.id,
      title: course.title,
      description: course.desc,
      category: course.cat,
      status: "active",
      sortOrder: courseIndex + 1,
      curriculumRevision: 0,
    })

    course.units.forEach((unit, unitIndex) => {
      unitRows.push({
        id: unit.id,
        courseId: course.id,
        title: unit.title,
        status: "active",
        sortOrder: unitIndex + 1,
      })

      unit.lessons.forEach((lesson, lessonIndex) => {
        lessonRows.push({
          id: lesson.id,
          courseId: course.id,
          unitId: unit.id,
          title: lesson.title,
          category: lesson.cat ?? null,
          description: lesson.desc ?? null,
          estimatedMinutes: parseEstimatedMinutes(lesson.time),
          summaryJson: JSON.stringify(lesson.summary ?? []),
          status: "active",
          sortOrder: lessonIndex + 1,
        })

        lesson.steps.forEach((step, stepIndex) => {
          stepRows.push({
            id: `${lesson.id}-s${stepIndex + 1}`,
            lessonId: lesson.id,
            type: toStandardLessonStepType(step.type),
            contentJson: JSON.stringify(step),
            status: "active",
            sortOrder: stepIndex + 1,
          })
        })
      })
    })
  })

  return {
    courses: courseRows,
    units: unitRows,
    lessons: lessonRows,
    steps: stepRows,
  }
}

function parseEstimatedMinutes(time: string): number {
  const minutes = Number.parseInt(time.replace("분", ""), 10)

  if (Number.isNaN(minutes) || minutes <= 0) {
    throw new Error(`Invalid lesson time: ${time}`)
  }

  return minutes
}

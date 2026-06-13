export type LessonStepType =
  | "AI_FEEDBACK"
  | "CATEGORIZE"
  | "COMPARE"
  | "FILL_BLANK"
  | "MATCH"
  | "MULTIPLE_CHOICE"
  | "ORDER"
  | "READING"
  | "SELECT"
  | "WRITE"

export type LessonStep = {
  readonly id: string
  readonly order: number
  readonly type: LessonStepType
}

export type Lesson = {
  readonly category: string | null
  readonly courseId: string
  readonly description: string | null
  readonly estimatedMinutes: number
  readonly id: string
  readonly steps: readonly LessonStep[]
  readonly summary: readonly string[]
  readonly title: string
  readonly unitId: string
}

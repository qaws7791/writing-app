export type CourseStatus = "active" | "archived"
export type LessonProgressStatus = "available" | "completed" | "locked"

export type CourseSummary = {
  readonly category: string
  readonly description: string
  readonly id: string
  readonly lessonCount: number
  readonly status: CourseStatus
  readonly title: string
}

export type CourseLessonSummary = {
  readonly category: string | null
  readonly description: string | null
  readonly estimatedMinutes: number
  readonly id: string
  readonly order: number
  readonly status: CourseStatus
  readonly title: string
}

export type CourseUnit = {
  readonly id: string
  readonly lessons: readonly CourseLessonSummary[]
  readonly order: number
  readonly title: string
}

export type CourseDetail = CourseSummary & {
  readonly progress: {
    readonly completedLessons: number
    readonly totalLessons: number
  }
  readonly progressPercent: number
  readonly units: readonly CourseUnit[]
}

export type ProgressLesson = {
  readonly estimatedMinutes: number
  readonly id: string
  readonly status: LessonProgressStatus
  readonly title: string
}

export type ProgressNextLesson = ProgressLesson & {
  readonly courseId: string
}

export type ProgressCourse = {
  readonly id: string
  readonly lessons: readonly ProgressLesson[]
  readonly nextLessons: readonly ProgressNextLesson[]
  readonly progressPercent: number
  readonly title: string
}

export type ProgressCourseList = {
  readonly courses: readonly ProgressCourse[]
  readonly currentStreakDays: number
}

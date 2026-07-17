import type {
  CourseId,
  LearnerCourseDetail,
  LearnerCourseSort,
  LearnerCourseSummary,
  LearnerId,
  LearnerLesson,
  LearnerProgressCourse,
  LessonId,
} from "@workspace/contracts/learning/read-data"

import type { LearnerCursorPosition } from "#core/modules/learning/application/learner-cursor"

export type LearnerCourseReadQuery = {
  readonly after?: LearnerCursorPosition
  readonly category?: string
  readonly limit: number
  readonly query?: string
  readonly sort: LearnerCourseSort
}

export type LearnerProgressReadQuery = {
  readonly after?: LearnerCursorPosition
  readonly limit: number
  readonly status?: "completed" | "in_progress"
  readonly userId: LearnerId
}

export type LearnerReadModelPage<TItem> = {
  readonly items: readonly TItem[]
  readonly nextPosition: LearnerCursorPosition | null
}

export type LearnerLessonReadResult =
  | { readonly kind: "found"; readonly value: LearnerLesson }
  | { readonly kind: "locked" }
  | { readonly kind: "not-found" }

export type LearnerReadModelRepository = {
  readonly findCourseDetail: (input: {
    readonly courseId: CourseId
    readonly userId: LearnerId
  }) => Promise<LearnerCourseDetail | null>
  readonly findLesson: (input: {
    readonly lessonId: LessonId
    readonly userId: LearnerId
  }) => Promise<LearnerLessonReadResult>
  readonly listCourseCategories: () => Promise<readonly string[]>
  readonly listCourses: (
    query: LearnerCourseReadQuery
  ) => Promise<LearnerReadModelPage<LearnerCourseSummary>>
  readonly listProgress: (
    query: LearnerProgressReadQuery
  ) => Promise<LearnerReadModelPage<LearnerProgressCourse>>
}

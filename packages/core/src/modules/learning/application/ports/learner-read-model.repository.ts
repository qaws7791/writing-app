import type {
  LearnerCourseDetail,
  LearnerCourseSort,
  LearnerCourseSummary,
  LearnerLesson,
  LearnerProgressCourse,
} from "@workspace/contracts/learning"

import type { LearnerCursorPosition } from "#core/modules/learning/application/learner-cursor"

export type LearnerCourseListRepositoryQuery = {
  readonly after?: LearnerCursorPosition
  readonly category?: string
  readonly limit: number
  readonly query?: string
  readonly sort: LearnerCourseSort
}

export type LearnerProgressListRepositoryQuery = {
  readonly after?: LearnerCursorPosition
  readonly limit: number
  readonly status?: "completed" | "in_progress"
  readonly userId: string
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
    readonly courseId: string
    readonly userId: string
  }) => Promise<LearnerCourseDetail | null>
  readonly findLesson: (input: {
    readonly lessonId: string
    readonly userId: string
  }) => Promise<LearnerLessonReadResult>
  readonly listCourseCategories: () => Promise<readonly string[]>
  readonly listCourses: (
    query: LearnerCourseListRepositoryQuery
  ) => Promise<LearnerReadModelPage<LearnerCourseSummary>>
  readonly listProgress: (
    query: LearnerProgressListRepositoryQuery
  ) => Promise<LearnerReadModelPage<LearnerProgressCourse>>
}

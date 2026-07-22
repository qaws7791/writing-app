import type { CourseId, LearnerId, LessonId } from "@workspace/types/ids"

import type {
  LearnerCourseDetail,
  LearnerCourseReadQuery,
  LearnerCourseSummary,
  LearnerLesson,
  LearnerProgressCourse,
  LearnerProgressReadQuery,
  LearnerReadModelPage,
} from "#learning/application/learning-read-model"

export type {
  LearnerCourseReadQuery,
  LearnerProgressReadQuery,
  LearnerReadModelPage,
} from "#learning/application/learning-read-model"

type LearnerLessonReadResult =
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

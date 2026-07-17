import type {
  CourseId,
  LearnerCourseDetail,
  LearnerCourseSummary,
  LearnerId,
  LearnerLesson,
  LessonId,
} from "@workspace/contracts/learning/read-data"
import {
  learnerCourseDetailSchema,
  learnerCourseSummarySchema,
  learnerLessonSchema,
} from "@workspace/contracts/learning/read-data"

import type {
  LearnerCourseReadQuery,
  LearnerReadModelPage,
  LearnerReadModelRepository,
} from "#core/modules/learning/application/ports/learner-read-model.repository"
import { err, ok, type Result } from "#core/shared/result"

export type LearnerContentServiceError =
  | { readonly kind: "course-not-found" }
  | { readonly kind: "lesson-locked" }
  | { readonly kind: "lesson-not-found" }

export type LearnerContentService = {
  readonly getCourseDetail: (input: {
    readonly courseId: CourseId
    readonly userId: LearnerId
  }) => Promise<Result<LearnerCourseDetail, LearnerContentServiceError>>
  readonly getLesson: (input: {
    readonly lessonId: LessonId
    readonly userId: LearnerId
  }) => Promise<Result<LearnerLesson, LearnerContentServiceError>>
  readonly listCourseCategories: () => Promise<readonly string[]>
  readonly listCourses: (
    query: LearnerCourseReadQuery
  ) => Promise<LearnerReadModelPage<LearnerCourseSummary>>
}

export function createLearnerContentService({
  readModelRepository,
}: {
  readonly readModelRepository: LearnerReadModelRepository
}): LearnerContentService {
  return {
    async getCourseDetail(input) {
      const course = await readModelRepository.findCourseDetail(input)
      return course === null
        ? err({ kind: "course-not-found" })
        : ok(learnerCourseDetailSchema.parse(course))
    },
    async getLesson(input) {
      const lesson = await readModelRepository.findLesson(input)

      switch (lesson.kind) {
        case "found":
          return ok(learnerLessonSchema.parse(lesson.value))
        case "locked":
          return err({ kind: "lesson-locked" })
        case "not-found":
          return err({ kind: "lesson-not-found" })
      }
    },
    listCourseCategories() {
      return readModelRepository.listCourseCategories()
    },
    async listCourses(query) {
      const page = await readModelRepository.listCourses(query)

      return {
        items: learnerCourseSummarySchema.array().parse(page.items),
        nextPosition: page.nextPosition,
      }
    },
  }
}

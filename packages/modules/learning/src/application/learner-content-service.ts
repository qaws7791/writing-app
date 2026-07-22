import type { CourseId, LearnerId, LessonId } from "@workspace/types/ids"
import { err, ok, type Result } from "@workspace/kernel/result"

import type {
  LearnerCourseDetail,
  LearnerCourseSummary,
  LearnerLesson,
} from "#learning/application/learning-read-model"
import type {
  LearnerCourseReadQuery,
  LearnerReadModelPage,
  LearnerReadModelRepository,
} from "#learning/application/ports/learner-read-model-repository"

type LearnerContentServiceError =
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
      return course === null ? err({ kind: "course-not-found" }) : ok(course)
    },
    async getLesson(input) {
      const lesson = await readModelRepository.findLesson(input)

      switch (lesson.kind) {
        case "found":
          return ok(lesson.value)
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
      return Object.freeze({
        items: Object.freeze(page.items.map(presentCourseSummary)),
        nextPosition: page.nextPosition,
      })
    },
  }
}

function presentCourseSummary(
  course: LearnerCourseSummary
): LearnerCourseSummary {
  return Object.freeze({
    category: course.category,
    contentStatus: course.contentStatus,
    description: course.description,
    id: course.id,
    lessonCount: course.lessonCount,
    title: course.title,
    version: Object.freeze({
      curriculumVersionId: course.version.curriculumVersionId,
      revision: course.version.revision,
    }),
    visualKey: course.visualKey,
  })
}

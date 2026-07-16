import type {
  LearnerCourseDetail,
  LearnerCourseListQuery,
  LearnerCoursePage,
  LearnerLesson,
} from "@workspace/contracts/learning"
import {
  learnerCourseDetailSchema,
  learnerCoursePageSchema,
  learnerLessonSchema,
} from "@workspace/contracts/learning"

import type { LearnerReadModelRepository } from "#core/modules/learning/application/ports/learner-read-model.repository"
import type { LearnerCursorCodec } from "#core/modules/learning/application/learner-cursor"
import { err, ok, type Result } from "#core/shared/result"

export type LearnerContentServiceError =
  | { readonly kind: "course-not-found" }
  | { readonly kind: "invalid-cursor" }
  | { readonly kind: "lesson-locked" }
  | { readonly kind: "lesson-not-found" }

export type LearnerContentService = {
  readonly getCourseDetail: (input: {
    readonly courseId: string
    readonly userId: string
  }) => Promise<Result<LearnerCourseDetail, LearnerContentServiceError>>
  readonly getLesson: (input: {
    readonly lessonId: string
    readonly userId: string
  }) => Promise<Result<LearnerLesson, LearnerContentServiceError>>
  readonly listCourseCategories: () => Promise<readonly string[]>
  readonly listCourses: (
    query: LearnerCourseListQuery
  ) => Promise<Result<LearnerCoursePage, LearnerContentServiceError>>
}

export function createLearnerContentService({
  cursorCodec,
  readModelRepository,
}: {
  readonly cursorCodec: LearnerCursorCodec
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
      const normalized = {
        category: query.category?.normalize("NFC"),
        query: query.query?.trim().normalize("NFC"),
        sort: query.sort,
      }
      const fingerprint = cursorCodec.createFingerprint(normalized)
      const after =
        query.cursor === undefined
          ? undefined
          : cursorCodec.decode(query.cursor, {
              endpoint: "courses",
              fingerprint,
            })

      if (query.cursor !== undefined && after === null) {
        return err({ kind: "invalid-cursor" })
      }

      const page = await readModelRepository.listCourses({
        ...normalized,
        after: after ?? undefined,
        limit: query.limit,
      })

      return ok(
        learnerCoursePageSchema.parse({
          items: page.items,
          nextCursor:
            page.nextPosition === null
              ? null
              : cursorCodec.encode({
                  endpoint: "courses",
                  fingerprint,
                  position: page.nextPosition,
                }),
        })
      )
    },
  }
}

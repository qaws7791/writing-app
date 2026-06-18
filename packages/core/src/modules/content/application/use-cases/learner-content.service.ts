import type {
  CourseId,
  LessonId,
} from "@workspace/core/modules/content/domain/content.ids"
import {
  courseDetailDtoSchema,
  courseListDtoSchema,
  lessonDtoSchema,
  type CourseDetailDto,
  type CourseListDto,
  type LessonDto,
} from "@workspace/core/modules/content/domain/content.dto"
import type { ContentRepository } from "@workspace/core/modules/content/application/ports/content.repository"
import type { ProgressReader } from "@workspace/core/modules/learning/domain/learning-progress-read-model"
import { withLearnerCourseProgress } from "@workspace/core/modules/learning/domain/learning-progress-read-model"
import { err, ok, type Result } from "@workspace/core/shared/result"

export type LearnerContentServiceError =
  | {
      readonly kind: "course-not-found"
      readonly courseId: CourseId
    }
  | {
      readonly kind: "lesson-not-found"
      readonly lessonId: LessonId
    }

export type LearnerContentService = {
  readonly listCourses: () => Promise<CourseListDto>
  readonly getCourseDetail: (input: {
    readonly courseId: CourseId
    readonly userId: string
  }) => Promise<Result<CourseDetailDto, LearnerContentServiceError>>
  readonly getLesson: (
    lessonId: LessonId
  ) => Promise<Result<LessonDto, LearnerContentServiceError>>
}

export function createLearnerContentService({
  contentRepository,
  progressReader,
}: {
  readonly contentRepository: ContentRepository
  readonly progressReader: ProgressReader
}): LearnerContentService {
  return {
    async listCourses() {
      return courseListDtoSchema.parse({
        courses: await contentRepository.listCourses(),
      })
    },
    async getCourseDetail(input) {
      const courseDetail = await contentRepository.findCourseDetail(
        input.courseId
      )

      if (courseDetail === null) {
        return err({
          courseId: input.courseId,
          kind: "course-not-found",
        })
      }

      const progress = await progressReader.readLearnerProgress(input.userId)

      return ok(
        courseDetailDtoSchema.parse(
          withLearnerCourseProgress(courseDetail, progress.lessonProgress)
        )
      )
    },
    async getLesson(lessonId) {
      const lesson = await contentRepository.findLesson(lessonId)

      if (lesson === null) {
        return err({
          kind: "lesson-not-found",
          lessonId,
        })
      }

      return ok(lessonDtoSchema.parse(lesson))
    },
  }
}

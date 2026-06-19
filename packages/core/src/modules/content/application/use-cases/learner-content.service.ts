import type {
  CourseId,
  LessonId,
} from "@workspace/core/modules/content/domain/content.ids"
import {
  courseDetailDtoSchema,
  type CourseDetailDto,
  type CourseListDto,
  type LessonDto,
} from "@workspace/core/modules/content/domain/content.dto"
import type { ContentRepository } from "@workspace/core/modules/content/application/ports/content.repository"
import {
  createContentReader,
  type ContentReaderError,
} from "@workspace/core/modules/content/application/use-cases/content-reader"
import type { ProgressReader } from "@workspace/core/modules/learning/domain/learning-progress-read-model"
import { withLearnerCourseProgress } from "@workspace/core/modules/learning/domain/learning-progress-read-model"
import { ok, type Result } from "@workspace/core/shared/result"

export type LearnerContentServiceError = ContentReaderError

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
  const contentReader = createContentReader(contentRepository)

  return {
    listCourses: contentReader.listCourses,
    async getCourseDetail(input) {
      const courseDetail = await contentReader.getCourseDetail(input.courseId)

      if (courseDetail.kind === "err") {
        return courseDetail
      }

      const progress = await progressReader.readLearnerProgress(input.userId)

      return ok(
        courseDetailDtoSchema.parse(
          withLearnerCourseProgress(courseDetail.value, progress.lessonProgress)
        )
      )
    },
    getLesson: contentReader.getLesson,
  }
}

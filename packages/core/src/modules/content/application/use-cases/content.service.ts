import type {
  CourseId,
  LessonId,
} from "@workspace/core/modules/content/domain/content.ids"
import {
  type CourseDetailDto,
  type CourseListDto,
  type LessonDto,
} from "@workspace/core/modules/content/domain/content.dto"
import type { ContentRepository } from "@workspace/core/modules/content/application/ports/content.repository"
import {
  createContentReader,
  type ContentReaderError,
} from "@workspace/core/modules/content/application/use-cases/content-reader"
import type { Result } from "@workspace/core/shared/result"

export type ContentServiceError = ContentReaderError

export type ContentService = {
  readonly listCourses: () => Promise<CourseListDto>
  readonly getCourseDetail: (
    courseId: CourseId
  ) => Promise<Result<CourseDetailDto, ContentServiceError>>
  readonly getLesson: (
    lessonId: LessonId
  ) => Promise<Result<LessonDto, ContentServiceError>>
}

export function createContentService(
  repository: ContentRepository
): ContentService {
  return createContentReader(repository)
}

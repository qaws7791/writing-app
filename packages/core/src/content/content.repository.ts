import type { CourseId, LessonId } from "./content.ids"
import type {
  CourseCategoryListDto,
  CourseDetailDto,
  LessonDto,
} from "./content.dto"

export type ContentRepositoryListResult<TValue> =
  | {
      status: "ok"
      value: TValue
    }
  | {
      status: "invalid-content"
    }
  | {
      status: "unavailable"
    }

export type ContentRepositoryFindResult<TValue> =
  | ContentRepositoryListResult<TValue>
  | {
      status: "not-found"
    }

export interface ContentRepository {
  listCourseCategories(): Promise<
    ContentRepositoryListResult<CourseCategoryListDto>
  >
  findCourseDetail(
    courseId: CourseId
  ): Promise<ContentRepositoryFindResult<CourseDetailDto>>
  findLesson(
    lessonId: LessonId
  ): Promise<ContentRepositoryFindResult<LessonDto>>
}

import type {
  CourseCategoryListDto,
  CourseDetailDto,
  LessonDto,
  LessonStepDto,
} from "./content.dto"
import type { CourseId, LessonId } from "./content.ids"

export type ContentRepositoryLessonStepDto = Omit<LessonStepDto, "content"> & {
  content: unknown
}

export type ContentRepositoryLessonDto = Omit<LessonDto, "steps"> & {
  steps: ContentRepositoryLessonStepDto[]
}

export interface ContentRepository {
  listCourseCategories(): Promise<CourseCategoryListDto>
  findCourseDetail(courseId: CourseId): Promise<CourseDetailDto | undefined>
  findLesson(
    lessonId: LessonId
  ): Promise<ContentRepositoryLessonDto | undefined>
}

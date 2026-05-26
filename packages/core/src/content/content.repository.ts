import type {
  CourseCategoryListDto,
  CourseDetailDto,
  CourseSearchResultDto,
  LessonDto,
  LessonStepDto,
} from "@/content/content.dto"
import type { CourseId, LessonId } from "@/content/content.ids"

export type ContentRepositoryLessonStepDto = Omit<LessonStepDto, "content"> & {
  content: unknown
}

export type ContentRepositoryLessonDto = Omit<LessonDto, "steps"> & {
  steps: ContentRepositoryLessonStepDto[]
}

export interface ContentRepository {
  listCourseCategories(): Promise<CourseCategoryListDto>
  searchCourses(query: string): Promise<CourseSearchResultDto>
  findCourseDetail(courseId: CourseId): Promise<CourseDetailDto | undefined>
  findLesson(
    lessonId: LessonId
  ): Promise<ContentRepositoryLessonDto | undefined>
}

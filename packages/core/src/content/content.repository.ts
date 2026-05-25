import type {
  CourseCategoryListDto,
  CourseDetailDto,
  LessonDto,
} from "@/content/content.dto"
import type { CourseId, LessonId } from "@/content/content.ids"

export interface ContentRepository {
  listCourseCategories(): Promise<CourseCategoryListDto>
  findCourseDetail(courseId: CourseId): Promise<CourseDetailDto | undefined>
  findLesson(lessonId: LessonId): Promise<LessonDto | undefined>
}

import type {
  CourseCategoryListDto,
  CourseDetailDto,
  LessonDto,
} from "@/content/content.dto"

export interface ContentRepository {
  listCourseCategories(): Promise<CourseCategoryListDto>
  findCourseDetail(courseId: string): Promise<CourseDetailDto | undefined>
  findLesson(lessonId: string): Promise<LessonDto | undefined>
}

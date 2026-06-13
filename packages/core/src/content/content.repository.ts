import type { CourseId, LessonId } from "@workspace/core/content/content.ids"
import type {
  CourseDetailDto,
  CourseSummaryDto,
  LessonDto,
} from "@workspace/core/content/content.dto"

export type ContentRepository = {
  readonly listCourses: () => Promise<readonly CourseSummaryDto[]>
  readonly findCourseDetail: (
    courseId: CourseId
  ) => Promise<CourseDetailDto | null>
  readonly findLesson: (lessonId: LessonId) => Promise<LessonDto | null>
}

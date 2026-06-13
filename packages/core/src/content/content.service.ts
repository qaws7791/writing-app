import type { CourseId, LessonId } from "@workspace/core/content/content.ids"
import {
  courseDetailDtoSchema,
  courseListDtoSchema,
  lessonDtoSchema,
  type CourseDetailDto,
  type CourseListDto,
  type LessonDto,
} from "@workspace/core/content/content.dto"
import type { ContentRepository } from "@workspace/core/content/content.repository"
import { err, ok, type Result } from "@workspace/core/result"

export type ContentServiceError =
  | {
      readonly kind: "course-not-found"
      readonly courseId: CourseId
    }
  | {
      readonly kind: "lesson-not-found"
      readonly lessonId: LessonId
    }

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
  return {
    async listCourses() {
      return courseListDtoSchema.parse({
        courses: await repository.listCourses(),
      })
    },
    async getCourseDetail(courseId) {
      const courseDetail = await repository.findCourseDetail(courseId)

      if (courseDetail === null) {
        return err({
          kind: "course-not-found",
          courseId,
        })
      }

      return ok(courseDetailDtoSchema.parse(courseDetail))
    },
    async getLesson(lessonId) {
      const lesson = await repository.findLesson(lessonId)

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

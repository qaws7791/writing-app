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
import { err, ok, type Result } from "@workspace/core/shared/result"

export type ContentReaderError =
  | {
      readonly kind: "course-not-found"
      readonly courseId: CourseId
    }
  | {
      readonly kind: "lesson-not-found"
      readonly lessonId: LessonId
    }

export type ContentReader = {
  readonly listCourses: () => Promise<CourseListDto>
  readonly getCourseDetail: (
    courseId: CourseId
  ) => Promise<Result<CourseDetailDto, ContentReaderError>>
  readonly getLesson: (
    lessonId: LessonId
  ) => Promise<Result<LessonDto, ContentReaderError>>
}

export function createContentReader(
  repository: ContentRepository
): ContentReader {
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

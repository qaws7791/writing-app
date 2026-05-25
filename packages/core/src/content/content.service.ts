import {
  courseCategoryListDtoSchema,
  courseDetailDtoSchema,
  lessonDtoSchema,
  type CourseCategoryListDto,
  type CourseDetailDto,
  type LessonDto,
} from "@/content/content.dto"
import type {
  ContentErrorDto,
  CourseNotFoundErrorDto,
  LessonNotFoundErrorDto,
} from "@/content/content.errors"
import type { ContentRepository } from "@/content/content.repository"

type OkResult<TValue> = {
  status: "ok"
  value: TValue
}

type NotFoundResult<
  TError extends CourseNotFoundErrorDto | LessonNotFoundErrorDto,
> = {
  status: "not-found"
  error: TError
}

type InvalidContentResult = {
  status: "invalid-content"
  error: Extract<ContentErrorDto, { code: "invalid-content-seed" }>
}

export type ContentServiceResult<TValue> =
  | OkResult<TValue>
  | NotFoundResult<CourseNotFoundErrorDto | LessonNotFoundErrorDto>
  | InvalidContentResult

export interface ContentService {
  listCourseCategories(): Promise<ContentServiceResult<CourseCategoryListDto>>
  getCourseDetail(
    courseId: string
  ): Promise<ContentServiceResult<CourseDetailDto>>
  getLesson(lessonId: string): Promise<ContentServiceResult<LessonDto>>
}

interface ContentServiceDependencies {
  repository: ContentRepository
}

export function createContentService({
  repository,
}: ContentServiceDependencies): ContentService {
  return {
    async listCourseCategories() {
      const categories = await repository.listCourseCategories()
      return {
        status: "ok",
        value: courseCategoryListDtoSchema.parse(categories),
      }
    },
    async getCourseDetail(courseId) {
      const course = await repository.findCourseDetail(courseId)
      if (!course) {
        return {
          status: "not-found",
          error: {
            code: "course-not-found",
            message: "Course was not found.",
            courseId,
          },
        }
      }

      return { status: "ok", value: courseDetailDtoSchema.parse(course) }
    },
    async getLesson(lessonId) {
      const lesson = await repository.findLesson(lessonId)
      if (!lesson) {
        return {
          status: "not-found",
          error: {
            code: "lesson-not-found",
            message: "Lesson was not found.",
            lessonId,
          },
        }
      }

      const parsedLesson = lessonDtoSchema.parse(lesson)
      const invalidOrder = parsedLesson.steps.some(
        (step, index) => step.order !== index + 1
      )

      if (invalidOrder) {
        return {
          status: "invalid-content",
          error: {
            code: "invalid-content-seed",
            message: "Lesson steps must use contiguous order starting at 1.",
            lessonId,
          },
        }
      }

      return { status: "ok", value: parsedLesson }
    },
  }
}

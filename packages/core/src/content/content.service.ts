import {
  courseCategoryListDtoSchema,
  courseDetailDtoSchema,
  courseSearchResultDtoSchema,
  lessonDtoSchema,
  type CourseCategoryListDto,
  type CourseDetailDto,
  type CourseSearchResultDto,
  type LessonDto,
} from "@/content/content.dto"
import type {
  ContentErrorDto,
  CourseNotFoundErrorDto,
  DatabaseUnavailableErrorDto,
  InvalidRequestErrorDto,
  LessonNotFoundErrorDto,
} from "@/content/content.errors"
import type { CourseId, LessonId } from "@/content/content.ids"
import type {
  ContentRepository,
  ContentRepositoryLessonDto,
} from "@/content/content.repository"

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

type UnavailableResult = {
  status: "unavailable"
  error: DatabaseUnavailableErrorDto
}

type InvalidRequestResult = {
  status: "invalid-request"
  error: InvalidRequestErrorDto
}

export type ContentServiceResult<TValue> =
  | OkResult<TValue>
  | NotFoundResult<CourseNotFoundErrorDto | LessonNotFoundErrorDto>
  | InvalidContentResult
  | UnavailableResult
  | InvalidRequestResult

export interface ContentService {
  listCourseCategories(): Promise<ContentServiceResult<CourseCategoryListDto>>
  searchCourses(
    query: string
  ): Promise<ContentServiceResult<CourseSearchResultDto>>
  getCourseDetail(
    courseId: CourseId
  ): Promise<ContentServiceResult<CourseDetailDto>>
  getLesson(lessonId: LessonId): Promise<ContentServiceResult<LessonDto>>
}

interface ContentServiceDependencies {
  repository: ContentRepository
}

const unavailableResult: UnavailableResult = {
  status: "unavailable",
  error: {
    code: "database-unavailable",
    message: "데이터베이스를 사용할 수 없습니다.",
  },
}

function invalidContentResult(lessonId?: string): InvalidContentResult {
  return {
    status: "invalid-content",
    error: {
      code: "invalid-content-seed",
      message: "콘텐츠 시드가 올바르지 않습니다.",
      ...(lessonId ? { lessonId } : {}),
    },
  }
}

export function createContentService({
  repository,
}: ContentServiceDependencies): ContentService {
  return {
    async listCourseCategories() {
      let categories: CourseCategoryListDto
      try {
        categories = await repository.listCourseCategories()
      } catch {
        return unavailableResult
      }

      const parsedCategories = courseCategoryListDtoSchema.safeParse(categories)
      if (!parsedCategories.success) {
        return invalidContentResult()
      }

      return {
        status: "ok",
        value: parsedCategories.data,
      }
    },
    async searchCourses(query) {
      const trimmedQuery = query.trim()

      if (!trimmedQuery) {
        return {
          status: "invalid-request",
          error: {
            code: "invalid-request",
            message: "검색어를 입력해야 합니다.",
          },
        }
      }

      let result: CourseSearchResultDto
      try {
        result = await repository.searchCourses(trimmedQuery)
      } catch {
        return unavailableResult
      }

      const parsedResult = courseSearchResultDtoSchema.safeParse(result)
      if (!parsedResult.success) {
        return invalidContentResult()
      }

      return {
        status: "ok",
        value: parsedResult.data,
      }
    },
    async getCourseDetail(courseId) {
      let course: CourseDetailDto | undefined
      try {
        course = await repository.findCourseDetail(courseId)
      } catch {
        return unavailableResult
      }

      if (!course) {
        return {
          status: "not-found",
          error: {
            code: "course-not-found",
            message: "코스를 찾을 수 없습니다.",
            courseId,
          },
        }
      }

      const parsedCourse = courseDetailDtoSchema.safeParse(course)
      if (!parsedCourse.success) {
        return invalidContentResult()
      }

      return { status: "ok", value: parsedCourse.data }
    },
    async getLesson(lessonId) {
      let lesson: ContentRepositoryLessonDto | undefined
      try {
        lesson = await repository.findLesson(lessonId)
      } catch {
        return unavailableResult
      }

      if (!lesson) {
        return {
          status: "not-found",
          error: {
            code: "lesson-not-found",
            message: "레슨을 찾을 수 없습니다.",
            lessonId,
          },
        }
      }

      const parsedLessonResult = lessonDtoSchema.safeParse(lesson)
      if (!parsedLessonResult.success) {
        return invalidContentResult(lessonId)
      }

      const parsedLesson = parsedLessonResult.data
      const invalidOrder = parsedLesson.steps.some(
        (step, index) => step.order !== index + 1
      )

      if (invalidOrder) {
        return {
          status: "invalid-content",
          error: {
            code: "invalid-content-seed",
            message: "레슨 스텝 순서는 1부터 빈틈없이 이어져야 합니다.",
            lessonId,
          },
        }
      }

      return { status: "ok", value: parsedLesson }
    },
  }
}

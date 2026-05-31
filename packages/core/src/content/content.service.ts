import type {
  CourseCategoryListDto,
  CourseDetailDto,
  LessonDto,
} from "./content.dto"
import type {
  ContentErrorDto,
  CourseNotFoundErrorDto,
  DatabaseUnavailableErrorDto,
  LessonNotFoundErrorDto,
} from "./content.errors"
import type { CourseId, LessonId } from "./content.ids"
import type { ContentRepository } from "./content.repository"
import type {
  InvalidContentResult,
  NotFoundResult,
  OkResult,
  UnavailableResult,
} from "../result"

type InvalidContentSeedResult = InvalidContentResult<
  Extract<ContentErrorDto, { code: "invalid-content-seed" }>
>

export type ContentServiceResult<TValue> =
  | OkResult<TValue>
  | NotFoundResult<CourseNotFoundErrorDto | LessonNotFoundErrorDto>
  | InvalidContentSeedResult
  | UnavailableResult<DatabaseUnavailableErrorDto>

export interface ContentService {
  listCourseCategories(): Promise<ContentServiceResult<CourseCategoryListDto>>
  getCourseDetail(
    courseId: CourseId
  ): Promise<ContentServiceResult<CourseDetailDto>>
  getLesson(lessonId: LessonId): Promise<ContentServiceResult<LessonDto>>
}

interface ContentServiceDependencies {
  repository: ContentRepository
}

const unavailableResult: UnavailableResult<DatabaseUnavailableErrorDto> = {
  status: "unavailable",
  error: {
    code: "database-unavailable",
    message: "데이터베이스를 사용할 수 없습니다.",
  },
}

function invalidContentResult(
  lessonId?: string,
  message = "콘텐츠 시드가 올바르지 않습니다."
): InvalidContentSeedResult {
  return {
    status: "invalid-content",
    error: {
      code: "invalid-content-seed",
      message,
      ...(lessonId ? { lessonId } : {}),
    },
  }
}

export function createContentService({
  repository,
}: ContentServiceDependencies): ContentService {
  return {
    async listCourseCategories() {
      let result: Awaited<ReturnType<ContentRepository["listCourseCategories"]>>
      try {
        result = await repository.listCourseCategories()
      } catch {
        return unavailableResult
      }

      if (result.status === "unavailable") {
        return unavailableResult
      }

      if (result.status === "invalid-content") {
        return invalidContentResult()
      }

      return {
        status: "ok",
        value: result.value,
      }
    },
    async getCourseDetail(courseId) {
      let result: Awaited<ReturnType<ContentRepository["findCourseDetail"]>>
      try {
        result = await repository.findCourseDetail(courseId)
      } catch {
        return unavailableResult
      }

      if (result.status === "unavailable") {
        return unavailableResult
      }

      if (result.status === "invalid-content") {
        return invalidContentResult()
      }

      if (result.status === "not-found") {
        return {
          status: "not-found",
          error: {
            code: "course-not-found",
            message: "코스를 찾을 수 없습니다.",
            courseId,
          },
        }
      }

      return { status: "ok", value: result.value }
    },
    async getLesson(lessonId) {
      let result: Awaited<ReturnType<ContentRepository["findLesson"]>>
      try {
        result = await repository.findLesson(lessonId)
      } catch {
        return unavailableResult
      }

      if (result.status === "unavailable") {
        return unavailableResult
      }

      if (result.status === "invalid-content") {
        return invalidContentResult(lessonId)
      }

      if (result.status === "not-found") {
        return {
          status: "not-found",
          error: {
            code: "lesson-not-found",
            message: "레슨을 찾을 수 없습니다.",
            lessonId,
          },
        }
      }

      const parsedLesson = result.value
      const invalidOrder = parsedLesson.steps.some(
        (step, index) => step.order !== index + 1
      )

      if (invalidOrder) {
        return invalidContentResult(
          lessonId,
          "레슨 스텝 순서는 1부터 빈틈없이 이어져야 합니다."
        )
      }

      const playableLessonError = validatePlayableLesson(parsedLesson)
      if (playableLessonError) {
        return invalidContentResult(lessonId, playableLessonError)
      }

      return { status: "ok", value: parsedLesson }
    },
  }
}

function validatePlayableLesson(lesson: LessonDto): string | null {
  if (lesson.steps.length === 0) {
    return "레슨에는 하나 이상의 스텝이 필요합니다."
  }

  const firstStep = lesson.steps[0]
  if (firstStep?.type !== "INTRO") {
    return "레슨은 INTRO 스텝으로 시작해야 합니다."
  }

  const lastStep = lesson.steps.at(-1)
  if (lastStep?.type !== "COMPLETE") {
    return "레슨은 COMPLETE 스텝으로 끝나야 합니다."
  }

  const stepIds = new Set(lesson.steps.map((step) => step.id))
  const hasMissingAiFeedbackSource = lesson.steps.some(
    (step) =>
      step.type === "AI_FEEDBACK" && !stepIds.has(step.content.sourceStepId)
  )

  if (hasMissingAiFeedbackSource) {
    return "AI 피드백 스텝이 참조하는 원본 스텝을 찾을 수 없습니다."
  }

  return null
}

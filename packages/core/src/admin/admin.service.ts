import {
  adminCourseDetailDtoSchema,
  adminCourseEditorDetailDtoSchema,
  adminCourseListDtoSchema,
  adminCourseTreeDtoSchema,
  adminEditorLessonDetailDtoSchema,
  adminUserListDtoSchema,
  type AdminCourseEditorDetailDto,
  type AdminCourseEditorSaveRequestDto,
  type AdminCourseDetailDto,
  type AdminCourseListDto,
  type AdminCourseListInputDto,
  type AdminCourseTreeDto,
  type AdminEditorLessonDetailDto,
  type AdminUserListDto,
} from "./admin.dto"
import type {
  AdminConflictErrorDto,
  AdminDatabaseUnavailableErrorDto,
  AdminInvalidRequestErrorDto,
  AdminNotFoundErrorDto,
} from "./admin.errors"
import type { AdminRepository } from "./admin.repository"
import type {
  ConflictResult,
  InvalidRequestResult,
  NotFoundResult,
  OkResult,
  UnavailableResult,
} from "../result"

export type AdminServiceResult<TValue> =
  | OkResult<TValue>
  | UnavailableResult<AdminDatabaseUnavailableErrorDto>

type AdminMutationServiceResult<TValue> =
  | AdminServiceResult<TValue>
  | InvalidRequestResult<AdminInvalidRequestErrorDto>
  | NotFoundResult<AdminNotFoundErrorDto>
  | ConflictResult<AdminConflictErrorDto>

export interface AdminService {
  getCourseDetail(
    courseId: string
  ): Promise<AdminMutationServiceResult<AdminCourseDetailDto>>
  getCourseEditorDocument(
    courseId: string
  ): Promise<AdminMutationServiceResult<AdminCourseEditorDetailDto>>
  listCourses(
    input: AdminCourseListInputDto
  ): Promise<AdminServiceResult<AdminCourseListDto>>
  listCourseTree(): Promise<AdminServiceResult<AdminCourseTreeDto>>
  getCourseLessonDetail(
    courseId: string,
    lessonId: string
  ): Promise<AdminMutationServiceResult<AdminEditorLessonDetailDto>>
  saveCourseEditorDocument(
    input: AdminCourseEditorSaveRequestDto
  ): Promise<AdminMutationServiceResult<AdminCourseEditorDetailDto>>
  listUsers(): Promise<AdminServiceResult<AdminUserListDto>>
}

interface AdminServiceDependencies {
  repository: AdminRepository
}

const unavailableResult: UnavailableResult<AdminDatabaseUnavailableErrorDto> = {
  status: "unavailable",
  error: {
    code: "database-unavailable",
    message: "데이터베이스를 사용할 수 없습니다.",
  },
}

export function createAdminService({
  repository,
}: AdminServiceDependencies): AdminService {
  return {
    async getCourseDetail(courseId) {
      try {
        const course = await repository.getCourseDetail(courseId)

        if (!course) {
          return notFound("코스를 찾을 수 없습니다.")
        }

        return {
          status: "ok",
          value: adminCourseDetailDtoSchema.parse(course),
        }
      } catch {
        return unavailableResult
      }
    },

    async getCourseEditorDocument(courseId) {
      try {
        const document = await repository.getCourseEditorDocument(courseId)

        if (!document) {
          return notFound("코스 편집 문서를 찾을 수 없습니다.")
        }

        return {
          status: "ok",
          value: adminCourseEditorDetailDtoSchema.parse(document),
        }
      } catch {
        return unavailableResult
      }
    },

    async listCourses(input) {
      try {
        return {
          status: "ok",
          value: adminCourseListDtoSchema.parse(
            await repository.listCourses(input)
          ),
        }
      } catch {
        return unavailableResult
      }
    },

    async listCourseTree() {
      try {
        return {
          status: "ok",
          value: adminCourseTreeDtoSchema.parse(
            await repository.listCourseTree()
          ),
        }
      } catch {
        return unavailableResult
      }
    },

    async getCourseLessonDetail(courseId, lessonId) {
      try {
        const lesson = await repository.getCourseLessonDetail(
          courseId,
          lessonId
        )

        if (!lesson) {
          return notFound("레슨을 찾을 수 없습니다.")
        }

        return {
          status: "ok",
          value: adminEditorLessonDetailDtoSchema.parse(lesson),
        }
      } catch {
        return unavailableResult
      }
    },

    async saveCourseEditorDocument(input) {
      try {
        const result = await repository.saveCourseEditorDocument(input)

        if (result.status !== "saved") {
          return result
        }

        return {
          status: "ok",
          value: adminCourseEditorDetailDtoSchema.parse(result.document),
        }
      } catch {
        return unavailableResult
      }
    },

    async listUsers() {
      try {
        return {
          status: "ok",
          value: adminUserListDtoSchema.parse(await repository.listUsers()),
        }
      } catch {
        return unavailableResult
      }
    },
  }
}

function notFound(message: string): NotFoundResult<AdminNotFoundErrorDto> {
  return {
    status: "not-found",
    error: {
      code: "not-found",
      message,
    },
  }
}

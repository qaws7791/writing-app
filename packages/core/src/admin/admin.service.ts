import {
  adminCourseDetailDtoSchema,
  adminCurriculumMigrationApplicationDtoSchema,
  adminCurriculumMigrationDetailDtoSchema,
  adminCourseListDtoSchema,
  adminCourseTreeDtoSchema,
  adminCurriculumVersionDetailDtoSchema,
  adminCurriculumVersionListDtoSchema,
  adminCurriculumVersionSummaryDtoSchema,
  adminEditorCurriculumVersionDetailDtoSchema,
  adminEditorLessonDetailDtoSchema,
  adminUserListDtoSchema,
  type AdminApplyCurriculumMigrationRequestDto,
  type AdminCourseDetailDto,
  type AdminCourseListDto,
  type AdminCourseListInputDto,
  type AdminCourseTreeDto,
  type AdminCreateCurriculumMigrationRequestDto,
  type AdminCurriculumMigrationApplicationDto,
  type AdminCurriculumMigrationDetailDto,
  type AdminCurriculumVersionDetailDto,
  type AdminCurriculumVersionListDto,
  type AdminCurriculumVersionSummaryDto,
  type AdminEditorCurriculumVersionDetailDto,
  type AdminEditorLessonDetailDto,
  type AdminRestoreCurriculumDraftRequestDto,
  type AdminSaveCurriculumVersionContentRequestDto,
  type AdminUserListDto,
} from "@/admin/admin.dto"
import type {
  AdminConflictErrorDto,
  AdminDatabaseUnavailableErrorDto,
  AdminInvalidRequestErrorDto,
  AdminNotFoundErrorDto,
} from "@/admin/admin.errors"
import type { AdminRepository } from "@/admin/admin.repository"

type OkResult<TValue> = {
  status: "ok"
  value: TValue
}

type UnavailableResult = {
  status: "unavailable"
  error: AdminDatabaseUnavailableErrorDto
}

type InvalidRequestResult = {
  status: "invalid-request"
  error: AdminInvalidRequestErrorDto
}

type NotFoundResult = {
  status: "not-found"
  error: AdminNotFoundErrorDto
}

type ConflictResult = {
  status: "conflict"
  error: AdminConflictErrorDto
}

export type AdminServiceResult<TValue> = OkResult<TValue> | UnavailableResult

type AdminCurriculumVersionServiceResult<TValue> =
  | AdminServiceResult<TValue>
  | InvalidRequestResult
  | NotFoundResult

type AdminCurriculumEditorServiceResult<TValue> =
  | AdminCurriculumVersionServiceResult<TValue>
  | ConflictResult

export interface AdminService {
  getCourseDetail(
    courseId: string
  ): Promise<AdminCurriculumVersionServiceResult<AdminCourseDetailDto>>
  listCourses(
    input: AdminCourseListInputDto
  ): Promise<AdminServiceResult<AdminCourseListDto>>
  listCourseTree(): Promise<AdminServiceResult<AdminCourseTreeDto>>
  listCurriculumVersions(
    courseId: string
  ): Promise<AdminServiceResult<AdminCurriculumVersionListDto>>
  createCurriculumDraft(
    courseId: string
  ): Promise<
    AdminCurriculumVersionServiceResult<AdminCurriculumVersionSummaryDto>
  >
  getCurriculumVersionDetail(
    versionId: string
  ): Promise<
    AdminCurriculumVersionServiceResult<AdminCurriculumVersionDetailDto>
  >
  getCourseCurriculumVersionDetail(
    courseId: string,
    versionId: string
  ): Promise<
    AdminCurriculumVersionServiceResult<AdminEditorCurriculumVersionDetailDto>
  >
  getCourseLessonDetail(
    courseId: string,
    lessonId: string
  ): Promise<AdminCurriculumVersionServiceResult<AdminEditorLessonDetailDto>>
  restoreCurriculumDraft(
    courseId: string,
    input: AdminRestoreCurriculumDraftRequestDto
  ): Promise<
    AdminCurriculumVersionServiceResult<AdminCurriculumVersionSummaryDto>
  >
  saveCurriculumVersionContent(
    input: AdminSaveCurriculumVersionContentRequestDto
  ): Promise<
    AdminCurriculumEditorServiceResult<AdminEditorCurriculumVersionDetailDto>
  >
  discardCurriculumVersion(
    courseId: string,
    versionId: string
  ): Promise<AdminCurriculumVersionServiceResult<{ versionId: string }>>
  publishCurriculumVersion(
    versionId: string
  ): Promise<
    AdminCurriculumVersionServiceResult<AdminCurriculumVersionSummaryDto>
  >
  createCurriculumMigration(
    input: AdminCreateCurriculumMigrationRequestDto
  ): Promise<
    AdminCurriculumVersionServiceResult<AdminCurriculumMigrationDetailDto>
  >
  getCurriculumMigration(
    migrationId: string
  ): Promise<
    AdminCurriculumVersionServiceResult<AdminCurriculumMigrationDetailDto>
  >
  applyCurriculumMigration(
    input: AdminApplyCurriculumMigrationRequestDto
  ): Promise<
    AdminCurriculumVersionServiceResult<AdminCurriculumMigrationApplicationDto>
  >
  listUsers(): Promise<AdminServiceResult<AdminUserListDto>>
}

interface AdminServiceDependencies {
  repository: AdminRepository
}

const unavailableResult: UnavailableResult = {
  status: "unavailable",
  error: {
    code: "database-unavailable",
    message: "Database is unavailable.",
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
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "Course was not found.",
            },
          }
        }

        return {
          status: "ok",
          value: adminCourseDetailDtoSchema.parse(course),
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
    async listCurriculumVersions(courseId) {
      try {
        return {
          status: "ok",
          value: adminCurriculumVersionListDtoSchema.parse(
            await repository.listCurriculumVersions(courseId)
          ),
        }
      } catch {
        return unavailableResult
      }
    },
    async createCurriculumDraft(courseId) {
      try {
        const result = await repository.createCurriculumDraft(courseId)

        if (result.status === "invalid-request") {
          return result
        }

        if (result.status === "not-found") {
          return result
        }

        return {
          status: "ok",
          value: adminCurriculumVersionSummaryDtoSchema.parse(result.version),
        }
      } catch {
        return unavailableResult
      }
    },
    async getCurriculumVersionDetail(versionId) {
      try {
        const version = await repository.getCurriculumVersionDetail(versionId)

        if (!version) {
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "Curriculum version was not found.",
            },
          }
        }

        return {
          status: "ok",
          value: adminCurriculumVersionDetailDtoSchema.parse(version),
        }
      } catch {
        return unavailableResult
      }
    },
    async getCourseCurriculumVersionDetail(courseId, versionId) {
      try {
        const version = await repository.getCourseCurriculumVersionDetail(
          courseId,
          versionId
        )

        if (!version) {
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "Curriculum version was not found.",
            },
          }
        }

        return {
          status: "ok",
          value: adminEditorCurriculumVersionDetailDtoSchema.parse(version),
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
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "Lesson was not found.",
            },
          }
        }

        return {
          status: "ok",
          value: adminEditorLessonDetailDtoSchema.parse(lesson),
        }
      } catch {
        return unavailableResult
      }
    },
    async restoreCurriculumDraft(courseId, input) {
      try {
        const result = await repository.restoreCurriculumDraft(courseId, input)

        if (result.status === "invalid-request") {
          return result
        }

        if (result.status === "not-found") {
          return result
        }

        return {
          status: "ok",
          value: adminCurriculumVersionSummaryDtoSchema.parse(result.version),
        }
      } catch {
        return unavailableResult
      }
    },
    async saveCurriculumVersionContent(input) {
      try {
        const result = await repository.saveCurriculumVersionContent(input)

        if (result.status === "invalid-request") {
          return result
        }

        if (result.status === "not-found") {
          return result
        }

        if (result.status === "conflict") {
          return result
        }

        return {
          status: "ok",
          value: adminEditorCurriculumVersionDetailDtoSchema.parse(
            result.version
          ),
        }
      } catch {
        return unavailableResult
      }
    },
    async discardCurriculumVersion(courseId, versionId) {
      try {
        const result = await repository.discardCurriculumVersion(
          courseId,
          versionId
        )

        if (result.status === "invalid-request") {
          return result
        }

        if (result.status === "not-found") {
          return result
        }

        return {
          status: "ok",
          value: { versionId: result.versionId },
        }
      } catch {
        return unavailableResult
      }
    },
    async publishCurriculumVersion(versionId) {
      try {
        const result = await repository.publishCurriculumVersion(versionId)

        if (result.status === "invalid-request") {
          return result
        }

        if (result.status === "not-found") {
          return result
        }

        return {
          status: "ok",
          value: adminCurriculumVersionSummaryDtoSchema.parse(result.version),
        }
      } catch {
        return unavailableResult
      }
    },
    async createCurriculumMigration(input) {
      try {
        const result = await repository.createCurriculumMigration(input)

        if (result.status === "invalid-request") {
          return result
        }

        if (result.status === "not-found") {
          return result
        }

        return {
          status: "ok",
          value: adminCurriculumMigrationDetailDtoSchema.parse(
            result.migration
          ),
        }
      } catch {
        return unavailableResult
      }
    },
    async getCurriculumMigration(migrationId) {
      try {
        const migration = await repository.getCurriculumMigration(migrationId)

        if (!migration) {
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "Curriculum migration was not found.",
            },
          }
        }

        return {
          status: "ok",
          value: adminCurriculumMigrationDetailDtoSchema.parse(migration),
        }
      } catch {
        return unavailableResult
      }
    },
    async applyCurriculumMigration(input) {
      try {
        const result = await repository.applyCurriculumMigration(input)

        if (result.status === "invalid-request") {
          return result
        }

        if (result.status === "not-found") {
          return result
        }

        return {
          status: "ok",
          value: adminCurriculumMigrationApplicationDtoSchema.parse(
            result.application
          ),
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

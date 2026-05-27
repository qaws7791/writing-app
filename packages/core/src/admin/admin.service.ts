import {
  adminCurriculumMigrationApplicationDtoSchema,
  adminCurriculumMigrationDetailDtoSchema,
  adminCourseListDtoSchema,
  adminCourseTreeDtoSchema,
  adminCurriculumVersionDetailDtoSchema,
  adminCurriculumVersionListDtoSchema,
  adminCurriculumVersionSummaryDtoSchema,
  adminUserListDtoSchema,
  type AdminApplyCurriculumMigrationRequestDto,
  type AdminCourseListDto,
  type AdminCourseListInputDto,
  type AdminCourseTreeDto,
  type AdminCreateCurriculumMigrationRequestDto,
  type AdminCurriculumMigrationApplicationDto,
  type AdminCurriculumMigrationDetailDto,
  type AdminCurriculumVersionDetailDto,
  type AdminCurriculumVersionListDto,
  type AdminCurriculumVersionSummaryDto,
  type AdminUserListDto,
} from "@/admin/admin.dto"
import type {
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

export type AdminServiceResult<TValue> = OkResult<TValue> | UnavailableResult

type AdminCurriculumVersionServiceResult<TValue> =
  | AdminServiceResult<TValue>
  | InvalidRequestResult
  | NotFoundResult

export interface AdminService {
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

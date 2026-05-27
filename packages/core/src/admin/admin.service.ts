import {
  adminCourseListDtoSchema,
  adminCourseTreeDtoSchema,
  adminUserListDtoSchema,
  type AdminCourseListDto,
  type AdminCourseListInputDto,
  type AdminCourseTreeDto,
  type AdminUserListDto,
} from "@/admin/admin.dto"
import type { AdminDatabaseUnavailableErrorDto } from "@/admin/admin.errors"
import type { AdminRepository } from "@/admin/admin.repository"

type OkResult<TValue> = {
  status: "ok"
  value: TValue
}

type UnavailableResult = {
  status: "unavailable"
  error: AdminDatabaseUnavailableErrorDto
}

export type AdminServiceResult<TValue> = OkResult<TValue> | UnavailableResult

export interface AdminService {
  listCourses(
    input: AdminCourseListInputDto
  ): Promise<AdminServiceResult<AdminCourseListDto>>
  listCourseTree(): Promise<AdminServiceResult<AdminCourseTreeDto>>
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

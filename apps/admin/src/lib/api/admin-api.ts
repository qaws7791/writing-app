import type {
  AdminCourseListDto,
  AdminCourseListInputDto,
  AdminCourseTreeDto,
  AdminErrorDto,
  AdminUserListDto,
} from "@workspace/core/admin"

export type AdminApiUnknownErrorDto = {
  code: "unknown-error"
  message: string
}

export type AdminApiErrorDto = AdminErrorDto | AdminApiUnknownErrorDto

export type AdminApiOkResult<TValue> = {
  status: "ok"
  value: TValue
}

export type AdminApiErrorResult = {
  status: "error"
  error: AdminApiErrorDto
  httpStatus: number
}

export type AdminApiResult<TValue> =
  | AdminApiOkResult<TValue>
  | AdminApiErrorResult

export interface AdminApi {
  listCourses(
    input: AdminCourseListInputDto
  ): Promise<AdminApiResult<AdminCourseListDto>>
  listCourseTree(): Promise<AdminApiResult<AdminCourseTreeDto>>
  listUsers(): Promise<AdminApiResult<AdminUserListDto>>
}

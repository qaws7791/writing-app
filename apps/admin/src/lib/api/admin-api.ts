import type {
  AdminCourseDetailDto,
  AdminCourseEditorDetailDto,
  AdminCourseEditorSaveRequestDto,
  AdminCourseListDto,
  AdminCourseListInputDto,
  AdminCourseTreeDto,
  AdminCurrentSessionDto,
  AdminEditorLessonDetailDto,
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
  getSession(): Promise<AdminApiResult<AdminCurrentSessionDto>>
  listCourses(
    input: AdminCourseListInputDto
  ): Promise<AdminApiResult<AdminCourseListDto>>
  listCourseTree(): Promise<AdminApiResult<AdminCourseTreeDto>>
  getCourseDetail(
    courseId: string
  ): Promise<AdminApiResult<AdminCourseDetailDto>>
  getCourseEditorDocument(
    courseId: string
  ): Promise<AdminApiResult<AdminCourseEditorDetailDto>>
  getCourseLessonDetail(
    courseId: string,
    lessonId: string
  ): Promise<AdminApiResult<AdminEditorLessonDetailDto>>
  saveCourseEditorDocument(
    input: AdminCourseEditorSaveRequestDto
  ): Promise<AdminApiResult<AdminCourseEditorDetailDto>>
  listUsers(): Promise<AdminApiResult<AdminUserListDto>>
}

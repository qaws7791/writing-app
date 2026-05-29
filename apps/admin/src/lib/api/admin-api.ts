import type {
  AdminCourseDetailDto,
  AdminCourseEditorDetailDto,
  AdminCourseEditorSaveRequestDto,
  AdminCourseListDto,
  AdminCourseListInputDto,
  AdminCourseTreeDto,
  AdminCurriculumVersionListDto,
  AdminCurriculumVersionSummaryDto,
  AdminEditorCurriculumVersionDetailDto,
  AdminEditorLessonDetailDto,
  AdminErrorDto,
  AdminRestoreCurriculumDraftRequestDto,
  AdminSaveCurriculumVersionContentRequestDto,
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
  getCourseDetail(
    courseId: string
  ): Promise<AdminApiResult<AdminCourseDetailDto>>
  getCourseEditorDocument(
    courseId: string,
    versionId: string | null
  ): Promise<AdminApiResult<AdminCourseEditorDetailDto>>
  listCurriculumVersions(
    courseId: string
  ): Promise<AdminApiResult<AdminCurriculumVersionListDto>>
  getCourseCurriculumVersionDetail(
    courseId: string,
    versionId: string
  ): Promise<AdminApiResult<AdminEditorCurriculumVersionDetailDto>>
  getCourseLessonDetail(
    courseId: string,
    versionId: string,
    lessonId: string
  ): Promise<AdminApiResult<AdminEditorLessonDetailDto>>
  createCurriculumDraft(
    courseId: string
  ): Promise<AdminApiResult<AdminCurriculumVersionSummaryDto>>
  restoreCurriculumDraft(
    courseId: string,
    input: AdminRestoreCurriculumDraftRequestDto
  ): Promise<AdminApiResult<AdminCurriculumVersionSummaryDto>>
  saveCurriculumVersionContent(
    input: AdminSaveCurriculumVersionContentRequestDto
  ): Promise<AdminApiResult<AdminEditorCurriculumVersionDetailDto>>
  saveCourseEditorDocument(
    input: AdminCourseEditorSaveRequestDto
  ): Promise<AdminApiResult<AdminEditorCurriculumVersionDetailDto>>
  publishCurriculumVersion(
    courseId: string,
    versionId: string
  ): Promise<AdminApiResult<AdminCurriculumVersionSummaryDto>>
  discardCurriculumVersion(
    courseId: string,
    versionId: string
  ): Promise<AdminApiResult<{ versionId: string }>>
  listUsers(): Promise<AdminApiResult<AdminUserListDto>>
}

import type {
  AdminCourseEditorDetailDto,
  AdminCourseEditorSaveRequestDto,
  AdminCourseDetailDto,
  AdminCourseListDto,
  AdminCourseListInputDto,
  AdminCourseTreeDto,
  AdminEditorLessonDetailDto,
  AdminUserListDto,
} from "./admin.dto"
import type {
  AdminConflictErrorDto,
  AdminInvalidRequestErrorDto,
  AdminNotFoundErrorDto,
} from "./admin.errors"

export type AdminCourseEditorSaveRepositoryResult =
  | {
      status: "saved"
      document: AdminCourseEditorDetailDto
    }
  | {
      status: "conflict"
      error: AdminConflictErrorDto
    }
  | {
      status: "invalid-request"
      error: AdminInvalidRequestErrorDto
    }
  | {
      status: "not-found"
      error: AdminNotFoundErrorDto
    }

export interface AdminRepository {
  getCourseDetail(courseId: string): Promise<AdminCourseDetailDto | undefined>
  getCourseEditorDocument(
    courseId: string
  ): Promise<AdminCourseEditorDetailDto | undefined>
  listCourses(input: AdminCourseListInputDto): Promise<AdminCourseListDto>
  listCourseTree(): Promise<AdminCourseTreeDto>
  getCourseLessonDetail(
    courseId: string,
    lessonId: string
  ): Promise<AdminEditorLessonDetailDto | undefined>
  saveCourseEditorDocument(
    input: AdminCourseEditorSaveRequestDto
  ): Promise<AdminCourseEditorSaveRepositoryResult>
  listUsers(): Promise<AdminUserListDto>
}

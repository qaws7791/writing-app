import type {
  AdminCourseEditorDetailDto,
  AdminCourseEditorSaveRequestDto,
  AdminCourseDetailDto,
  AdminCourseListDto,
  AdminCourseListInputDto,
  AdminCourseTreeDto,
  AdminEditorCurriculumDetailDto,
  AdminEditorLessonDetailDto,
  AdminSaveCurriculumContentRequestDto,
  AdminUserListDto,
} from "@/admin/admin.dto"
import type {
  AdminInvalidRequestErrorDto,
  AdminNotFoundErrorDto,
} from "@/admin/admin.errors"

export type AdminSaveCurriculumContentRepositoryResult =
  | {
      status: "saved"
      curriculum: AdminEditorCurriculumDetailDto
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
  saveCurriculumContent(
    input: AdminSaveCurriculumContentRequestDto
  ): Promise<AdminSaveCurriculumContentRepositoryResult>
  saveCourseEditorDocument(
    input: AdminCourseEditorSaveRequestDto
  ): Promise<AdminSaveCurriculumContentRepositoryResult>
  listUsers(): Promise<AdminUserListDto>
}

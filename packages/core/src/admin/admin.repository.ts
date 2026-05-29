import type {
  AdminApplyCurriculumMigrationRequestDto,
  AdminCourseEditorDetailDto,
  AdminCourseEditorSaveRequestDto,
  AdminCourseDetailDto,
  AdminCourseListDto,
  AdminCourseListInputDto,
  AdminCourseTreeDto,
  AdminCreateCurriculumMigrationRequestDto,
  AdminCurriculumMigrationApplicationDto,
  AdminCurriculumMigrationDetailDto,
  AdminCurriculumVersionDetailDto,
  AdminCurriculumVersionListDto,
  AdminCurriculumVersionSummaryDto,
  AdminEditorCurriculumVersionDetailDto,
  AdminEditorLessonDetailDto,
  AdminRestoreCurriculumDraftRequestDto,
  AdminSaveCurriculumVersionContentRequestDto,
  AdminUserListDto,
} from "@/admin/admin.dto"
import type {
  AdminConflictErrorDto,
  AdminInvalidRequestErrorDto,
  AdminNotFoundErrorDto,
} from "@/admin/admin.errors"

export type AdminCreateCurriculumDraftRepositoryResult =
  | {
      status: "created"
      version: AdminCurriculumVersionSummaryDto
    }
  | {
      status: "invalid-request"
      error: AdminInvalidRequestErrorDto
    }
  | {
      status: "not-found"
      error: AdminNotFoundErrorDto
    }

export type AdminPublishCurriculumVersionRepositoryResult =
  | {
      status: "published"
      version: AdminCurriculumVersionSummaryDto
    }
  | {
      status: "invalid-request"
      error: AdminInvalidRequestErrorDto
    }
  | {
      status: "not-found"
      error: AdminNotFoundErrorDto
    }

export type AdminCreateCurriculumMigrationRepositoryResult =
  | {
      status: "created"
      migration: AdminCurriculumMigrationDetailDto
    }
  | {
      status: "invalid-request"
      error: AdminInvalidRequestErrorDto
    }
  | {
      status: "not-found"
      error: AdminNotFoundErrorDto
    }

export type AdminApplyCurriculumMigrationRepositoryResult =
  | {
      status: "applied"
      application: AdminCurriculumMigrationApplicationDto
    }
  | {
      status: "invalid-request"
      error: AdminInvalidRequestErrorDto
    }
  | {
      status: "not-found"
      error: AdminNotFoundErrorDto
    }

export type AdminSaveCurriculumVersionContentRepositoryResult =
  | {
      status: "saved"
      version: AdminEditorCurriculumVersionDetailDto
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

export type AdminDiscardCurriculumVersionRepositoryResult =
  | {
      status: "discarded"
      versionId: string
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
    courseId: string,
    versionId: string | null
  ): Promise<AdminCourseEditorDetailDto | undefined>
  listCourses(input: AdminCourseListInputDto): Promise<AdminCourseListDto>
  listCourseTree(): Promise<AdminCourseTreeDto>
  listCurriculumVersions(
    courseId: string
  ): Promise<AdminCurriculumVersionListDto>
  createCurriculumDraft(
    courseId: string
  ): Promise<AdminCreateCurriculumDraftRepositoryResult>
  getCurriculumVersionDetail(
    versionId: string
  ): Promise<AdminCurriculumVersionDetailDto | undefined>
  getCourseCurriculumVersionDetail(
    courseId: string,
    versionId: string
  ): Promise<AdminEditorCurriculumVersionDetailDto | undefined>
  getCourseLessonDetail(
    courseId: string,
    versionId: string,
    lessonId: string
  ): Promise<AdminEditorLessonDetailDto | undefined>
  restoreCurriculumDraft(
    courseId: string,
    input: AdminRestoreCurriculumDraftRequestDto
  ): Promise<AdminCreateCurriculumDraftRepositoryResult>
  saveCurriculumVersionContent(
    input: AdminSaveCurriculumVersionContentRequestDto
  ): Promise<AdminSaveCurriculumVersionContentRepositoryResult>
  saveCourseEditorDocument(
    input: AdminCourseEditorSaveRequestDto
  ): Promise<AdminSaveCurriculumVersionContentRepositoryResult>
  discardCurriculumVersion(
    courseId: string,
    versionId: string
  ): Promise<AdminDiscardCurriculumVersionRepositoryResult>
  publishCurriculumVersion(
    versionId: string
  ): Promise<AdminPublishCurriculumVersionRepositoryResult>
  createCurriculumMigration(
    input: AdminCreateCurriculumMigrationRequestDto
  ): Promise<AdminCreateCurriculumMigrationRepositoryResult>
  getCurriculumMigration(
    migrationId: string
  ): Promise<AdminCurriculumMigrationDetailDto | undefined>
  applyCurriculumMigration(
    input: AdminApplyCurriculumMigrationRequestDto
  ): Promise<AdminApplyCurriculumMigrationRepositoryResult>
  listUsers(): Promise<AdminUserListDto>
}

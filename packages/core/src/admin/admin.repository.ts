import type {
  AdminCourseListDto,
  AdminCourseListInputDto,
  AdminCourseTreeDto,
  AdminCurriculumVersionDetailDto,
  AdminCurriculumVersionListDto,
  AdminCurriculumVersionSummaryDto,
  AdminUserListDto,
} from "@/admin/admin.dto"
import type {
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

export interface AdminRepository {
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
  publishCurriculumVersion(
    versionId: string
  ): Promise<AdminPublishCurriculumVersionRepositoryResult>
  listUsers(): Promise<AdminUserListDto>
}

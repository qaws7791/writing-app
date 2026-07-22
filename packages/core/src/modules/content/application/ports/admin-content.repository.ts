import type {
  AdminCourseDetailDto,
  AdminCourseEditorDocument,
  AdminCourseListItemDto,
  AdminCourseListStatusFilter,
  AdminPublishCourseResult,
} from "@workspace/contracts/content/admin-data"
import type { AdminContentResetResultDto } from "@workspace/contracts/operations/content-reset-data"

export type ResetAdminContentInput = {
  readonly now: Date
}

export type CreateAdminCourseInput = {
  readonly now: Date
}

export type ReadAdminCoursesInput = {
  readonly category: string
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: AdminCourseListStatusFilter
}

export type ReadAdminCoursesResult = {
  readonly items: readonly AdminCourseListItemDto[]
  readonly page: number
  readonly pageSize: number
  readonly totalItems: number
  readonly totalPages: number
}

export type ReadAdminCourseInput = {
  readonly courseId: string
}

export type SaveAdminCourseEditorInput = {
  readonly courseId: string
  readonly document: AdminCourseEditorDocument
  readonly expectedEditVersion: number
  readonly now: Date
}

export type SaveAdminCourseEditorPersistenceResult =
  | { readonly kind: "invalid-reference" }
  | { readonly kind: "not-found" }
  | { readonly kind: "ok"; readonly value: AdminCourseEditorDocument }
  | { readonly kind: "stale-revision" }

export type ArchiveAdminCourseInput = {
  readonly courseId: string
  readonly now: Date
}

export type ArchiveAdminCoursePersistenceResult =
  | { readonly kind: "not-found" }
  | { readonly kind: "ok" }

export type PublishAdminCourseInput = {
  readonly courseId: string
  readonly expectedEditVersion: number
  readonly now: Date
}

export type PublishAdminCoursePersistenceResult =
  | { readonly kind: "invalid-draft" }
  | { readonly kind: "not-found" }
  | { readonly kind: "ok"; readonly value: AdminPublishCourseResult }
  | { readonly kind: "stale-revision" }

export type CourseAdminRepository = {
  readonly archiveCourse: (
    input: ArchiveAdminCourseInput
  ) => Promise<ArchiveAdminCoursePersistenceResult>
  readonly createCourse: (
    input: CreateAdminCourseInput
  ) => Promise<AdminCourseDetailDto>
  readonly readCourseEditor: (
    input: ReadAdminCourseInput
  ) => Promise<AdminCourseEditorDocument | null>
  readonly readCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<ReadAdminCoursesResult>
  readonly publishCourse: (
    input: PublishAdminCourseInput
  ) => Promise<PublishAdminCoursePersistenceResult>
  readonly saveCourseEditor: (
    input: SaveAdminCourseEditorInput
  ) => Promise<SaveAdminCourseEditorPersistenceResult>
}

export type ContentResetRepository = {
  readonly resetContent: (
    input: ResetAdminContentInput
  ) => Promise<AdminContentResetResultDto>
}

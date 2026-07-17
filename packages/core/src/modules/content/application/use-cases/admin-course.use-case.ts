import type {
  AdminCourseDetailDto,
  AdminCourseEditorDocument,
  AdminPublishCourseResult,
} from "@workspace/contracts/admin/content-data"
import type {
  ArchiveAdminCourseInput,
  CourseAdminRepository,
  CreateAdminCourseInput,
  PublishAdminCourseInput,
  ReadAdminCourseInput,
  ReadAdminCoursesInput,
  ReadAdminCoursesResult,
  SaveAdminCourseEditorInput,
} from "#core/modules/content/application/ports/admin-content.repository"
import {
  authorizeOwnerMutation,
  type AdminOwnerMutationResult,
  type OwnerAdminCommand,
} from "#core/shared/admin-owner-authorization"

export type AdminCourseUseCase = {
  readonly archiveCourse: (
    input: OwnerAdminCommand<ArchiveAdminCourseInput>
  ) => Promise<AdminCourseArchiveResult>
  readonly createCourse: (
    input: OwnerAdminCommand<CreateAdminCourseInput>
  ) => Promise<AdminOwnerMutationResult<AdminCourseDetailDto>>
  readonly getCourseEditor: (
    input: ReadAdminCourseInput
  ) => Promise<AdminCourseEditorDocument | null>
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminCourseListResult>
  readonly publishCourse: (
    input: OwnerAdminCommand<PublishAdminCourseInput>
  ) => Promise<AdminCoursePublishResult>
  readonly saveCourseEditor: (
    input: OwnerAdminCommand<SaveAdminCourseEditorInput>
  ) => Promise<AdminCourseEditorSaveResult>
}

export type AdminCourseArchiveResult =
  | { readonly kind: "forbidden" }
  | { readonly kind: "not-found" }
  | { readonly kind: "ok" }

export type AdminCourseListResult = ReadAdminCoursesResult

export type AdminCourseEditorSaveResult =
  | Exclude<AdminOwnerMutationResult<AdminCourseEditorDocument>, { kind: "ok" }>
  | { readonly kind: "invalid-reference" }
  | { readonly kind: "ok"; readonly value: AdminCourseEditorDocument }
  | { readonly kind: "stale-revision" }

export type AdminCoursePublishResult =
  | Exclude<AdminOwnerMutationResult<AdminPublishCourseResult>, { kind: "ok" }>
  | { readonly kind: "invalid-draft" }
  | { readonly kind: "ok"; readonly value: AdminPublishCourseResult }
  | { readonly kind: "stale-revision" }

export function createAdminCourseUseCase(
  courseRepository: CourseAdminRepository
): AdminCourseUseCase {
  return {
    async archiveCourse({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      return courseRepository.archiveCourse(input)
    },
    async createCourse({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const value = await courseRepository.createCourse(input)
      return { kind: "ok", value }
    },
    async getCourseEditor(input) {
      return courseRepository.readCourseEditor(input)
    },
    async getCourses(input) {
      return courseRepository.readCourses(input)
    },
    async publishCourse({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      return courseRepository.publishCourse(input)
    },
    async saveCourseEditor({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      return courseRepository.saveCourseEditor(input)
    },
  }
}

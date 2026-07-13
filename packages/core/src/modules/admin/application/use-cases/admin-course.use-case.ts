import {
  adminArchiveCourseResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseEditorDocumentSchema,
  adminCourseListDtoSchema,
  type AdminArchiveCourseResultDto,
  type AdminCourseDetailDto,
  type AdminCourseEditorDocument,
  type AdminCourseListDto,
} from "#core/modules/admin/domain/admin.dto"
import type {
  ArchiveAdminCourseInput,
  CourseAdminRepository,
  CreateAdminCourseInput,
  ReadAdminCourseInput,
  ReadAdminCoursesInput,
  SaveAdminCourseEditorInput,
} from "#core/modules/admin/application/ports/admin.repository"
import {
  authorizeOwnerMutation,
  type AdminOwnerMutationResult,
  type OwnerAdminCommand,
} from "#core/modules/admin/application/policies/admin-actor-policy"

export type AdminCourseUseCase = {
  readonly archiveCourse: (
    input: OwnerAdminCommand<ArchiveAdminCourseInput>
  ) => Promise<AdminOwnerMutationResult<AdminArchiveCourseResultDto>>
  readonly createCourse: (
    input: OwnerAdminCommand<CreateAdminCourseInput>
  ) => Promise<AdminOwnerMutationResult<AdminCourseDetailDto>>
  readonly getCourseEditor: (
    input: ReadAdminCourseInput
  ) => Promise<AdminCourseEditorDocument | null>
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminCourseListDto>
  readonly saveCourseEditor: (
    input: OwnerAdminCommand<SaveAdminCourseEditorInput>
  ) => Promise<AdminCourseEditorSaveResult>
}

export type AdminCourseEditorSaveResult =
  | Exclude<AdminOwnerMutationResult<AdminCourseEditorDocument>, { kind: "ok" }>
  | { readonly kind: "invalid-reference" }
  | { readonly kind: "ok"; readonly value: AdminCourseEditorDocument }
  | { readonly kind: "stale-revision" }

export function createAdminCourseUseCase(
  courseRepository: CourseAdminRepository
): AdminCourseUseCase {
  return {
    async archiveCourse({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const value = adminArchiveCourseResultSchema
        .nullable()
        .parse(await courseRepository.archiveCourse(input))
      return value === null ? { kind: "not-found" } : { kind: "ok", value }
    },
    async createCourse({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const value = adminCourseDetailDtoSchema.parse(
        await courseRepository.createCourse(input)
      )
      return { kind: "ok", value }
    },
    async getCourseEditor(input) {
      return adminCourseEditorDocumentSchema
        .nullable()
        .parse(await courseRepository.readCourseEditor(input))
    },
    async getCourses(input) {
      return adminCourseListDtoSchema.parse(
        await courseRepository.readCourses(input)
      )
    },
    async saveCourseEditor({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const result = await courseRepository.saveCourseEditor(input)

      return result.kind === "ok"
        ? {
            kind: "ok",
            value: adminCourseEditorDocumentSchema.parse(result.value),
          }
        : result
    },
  }
}

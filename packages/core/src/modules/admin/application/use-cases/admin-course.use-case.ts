import {
  adminArchiveCourseResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
  type AdminArchiveCourseResultDto,
  type AdminCourseDetailDto,
  type AdminCourseListDto,
} from "#core/modules/admin/domain/admin.dto"
import type {
  ArchiveAdminCourseInput,
  CourseAdminRepository,
  CreateAdminCourseInput,
  ReadAdminCourseInput,
  ReadAdminCoursesInput,
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
  ) => Promise<AdminCourseDetailDto | null>
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminCourseListDto>
}

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
      return adminCourseDetailDtoSchema
        .nullable()
        .parse(await courseRepository.readCourseEditor(input))
    },
    async getCourses(input) {
      return adminCourseListDtoSchema.parse(
        await courseRepository.readCourses(input)
      )
    },
  }
}

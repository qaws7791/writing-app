import {
  adminArchiveCourseResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
  type AdminArchiveCourseResultDto,
  type AdminCourseDetailDto,
  type AdminCourseListDto,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  ArchiveAdminCourseInput,
  CourseAdminRepository,
  CreateAdminCourseInput,
  ReadAdminCourseInput,
  ReadAdminCoursesInput,
} from "@workspace/core/modules/admin/application/ports/admin.repository"

export type AdminCourseUseCase = {
  readonly archiveCourse: (
    input: ArchiveAdminCourseInput
  ) => Promise<AdminArchiveCourseResultDto | null>
  readonly createCourse: (
    input: CreateAdminCourseInput
  ) => Promise<AdminCourseDetailDto>
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
    async archiveCourse(input) {
      return adminArchiveCourseResultSchema
        .nullable()
        .parse(await courseRepository.archiveCourse(input))
    },
    async createCourse(input) {
      return adminCourseDetailDtoSchema.parse(
        await courseRepository.createCourse(input)
      )
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

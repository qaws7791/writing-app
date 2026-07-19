import {
  adminArchiveCourseResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
} from "@workspace/contracts/admin"

import type { CourseId } from "@/entities/course/model/course-id"
import type {
  AdminArchiveCourseResult,
  AdminCourseList,
  AdminCreatedCourse,
  ReadAdminCoursesInput,
} from "@/features/course-catalog/model/admin-course-catalog"
import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"
import type { AdminApiResult } from "@/shared/http/admin-api-result"

export type AdminCourseCatalogDal = {
  readonly archiveCourse: (
    courseId: CourseId
  ) => Promise<AdminApiResult<AdminArchiveCourseResult>>
  readonly createCourse: () => Promise<AdminApiResult<AdminCreatedCourse>>
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminApiResult<AdminCourseList>>
}

export function createAdminCourseCatalogDal(
  transport: AdminHttpTransport
): AdminCourseCatalogDal {
  return {
    archiveCourse: (courseId) =>
      transport.requestJson({
        method: "DELETE",
        path: `/courses/${courseId}`,
        schema: adminArchiveCourseResultSchema,
      }),
    createCourse: () =>
      transport.requestJson({
        method: "POST",
        path: "/courses",
        schema: adminCourseDetailDtoSchema,
      }),
    async getCourses(input) {
      const params = new URLSearchParams()
      params.set("category", input.category)
      params.set("page", String(input.page))
      params.set("pageSize", String(input.pageSize))
      params.set("query", input.query)
      params.set("status", input.status)
      return transport.requestJson({
        method: "GET",
        path: `/courses?${params.toString()}`,
        schema: adminCourseListDtoSchema,
      })
    },
  }
}

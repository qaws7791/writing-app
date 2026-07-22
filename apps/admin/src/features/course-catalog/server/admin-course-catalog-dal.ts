import {
  adminArchiveCourseResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
} from "@workspace/contracts/content/admin-courses"

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
        path: `/api/admin/courses/${courseId}`,
        schema: adminArchiveCourseResultSchema,
      }),
    createCourse: () =>
      transport.requestJson({
        method: "POST",
        path: "/api/admin/courses",
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
        path: `/api/admin/courses?${params.toString()}`,
        schema: adminCourseListDtoSchema,
      })
    },
  }
}

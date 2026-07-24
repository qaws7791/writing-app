import type {
  archiveAdminCourse,
  createAdminCourse,
  getAdminCourses,
} from "@workspace/http-client/admin"

type AdminCourseListQuery = NonNullable<Parameters<typeof getAdminCourses>[0]>
type AdminCourseStatus = NonNullable<AdminCourseListQuery["status"]>
export type ReadAdminCoursesInput = {
  readonly category: string
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: AdminCourseStatus
}
export type AdminCreatedCourse = Awaited<ReturnType<typeof createAdminCourse>>
export type AdminCourseList = Awaited<ReturnType<typeof getAdminCourses>>
export type AdminArchiveCourseResult = Awaited<
  ReturnType<typeof archiveAdminCourse>
>

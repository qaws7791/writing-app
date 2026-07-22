import type {
  AdminArchiveCourseResultDto,
  AdminCourseDetailDto,
  AdminCourseListDto,
} from "@workspace/contracts/content/admin-courses"

type AdminCourseStatus = "active" | "archived"
export type ReadAdminCoursesInput = {
  readonly category: string
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: "all" | AdminCourseStatus
}
export type AdminCreatedCourse = AdminCourseDetailDto
export type AdminCourseList = AdminCourseListDto
export type AdminArchiveCourseResult = AdminArchiveCourseResultDto

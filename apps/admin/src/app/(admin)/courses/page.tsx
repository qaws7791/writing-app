import { parseAdminCourseFilters } from "@/features/course-catalog/model/admin-course-filters"
import {
  archiveAdminCourseAction,
  createAdminCourseAction,
} from "@/features/course-catalog/server/admin-course-actions"
import { createAdminCourseCatalogDal } from "@/features/course-catalog/server/admin-course-catalog-dal"
import { AdminCoursesPage } from "@/features/course-catalog/ui/admin-courses-page"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"

export default async function AdminCoursesRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseAdminCourseFilters(await searchParams)
  const coursesResult = await createAdminCourseCatalogDal(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  ).getCourses(filters)

  return (
    <AdminCoursesPage
      archiveCourse={archiveAdminCourseAction}
      coursesResult={coursesResult}
      createCourse={createAdminCourseAction}
      filters={filters}
    />
  )
}

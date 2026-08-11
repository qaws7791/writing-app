import { parseAdminCourseFilters } from "@/features/course-catalog/model/admin-course-filters"
import {
  archiveAdminCourseAction,
  createAdminCourseAction,
  restoreAdminCourseAction,
} from "@/features/course-catalog/server/admin-course-actions"
import { AdminCoursesPage } from "@/features/course-catalog/ui/admin-courses-page"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { getAdminCourses } from "@workspace/http-client/admin"

export default async function AdminCoursesRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseAdminCourseFilters(await searchParams)
  const requestOptions = await getServerAdminRequestOptions()
  const coursesResult =
    requestOptions === null
      ? unauthenticatedAdminRequestFailure()
      : await settleAdminApiRequest(
          getAdminCourses(
            {
              ...filters,
              category: filters.category === "all" ? "" : filters.category,
            },
            requestOptions
          )
        )

  return (
    <AdminCoursesPage
      archiveCourse={archiveAdminCourseAction}
      coursesResult={coursesResult}
      createCourse={createAdminCourseAction}
      filters={filters}
      restoreCourse={restoreAdminCourseAction}
    />
  )
}

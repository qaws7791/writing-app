import { AdminCoursesPage } from "@/features/courses/admin-courses-page"
import {
  archiveAdminCourseAction,
  createAdminCourseAction,
} from "@/features/courses/admin-course-actions"
import {
  createAdminCoursesApi,
  type ReadAdminCoursesInput,
} from "@/features/courses/admin-courses-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { contentStatusSchema } from "@workspace/contracts/status"

export default async function AdminCoursesRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const filters = readCourseFilters(resolvedSearchParams)
  const api = createAdminCoursesApi(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  )
  const coursesResult = await api.getCourses(filters)

  return (
    <AdminCoursesPage
      archiveCourse={archiveAdminCourseAction}
      coursesResult={coursesResult}
      createCourse={createAdminCourseAction}
      filters={filters}
    />
  )
}

function readCourseFilters(
  searchParams: Record<string, string | string[] | undefined>
): ReadAdminCoursesInput {
  return {
    category: readString(searchParams["category"], ""),
    page: readPositiveInteger(searchParams["page"], 1),
    pageSize: readPositiveInteger(searchParams["pageSize"], 20),
    query: readString(searchParams["query"], ""),
    status: readCourseStatus(readString(searchParams["status"], "all")),
  }
}

function readString(value: string | string[] | undefined, fallback: string) {
  return typeof value === "string" ? value : fallback
}

function readPositiveInteger(
  value: string | string[] | undefined,
  fallback: number
) {
  const parsed = Number(readString(value, ""))

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function readCourseStatus(value: string): ReadAdminCoursesInput["status"] {
  const status = contentStatusSchema.safeParse(value)

  return status.success ? status.data : "all"
}

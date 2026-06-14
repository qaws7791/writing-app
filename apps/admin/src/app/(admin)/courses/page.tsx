import { AdminCoursesPage } from "@/features/courses/admin-courses-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import type { ReadAdminCoursesInput } from "@/lib/api/admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminCoursesRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const filters = readCourseFilters(resolvedSearchParams)
  const api = getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  })
  const coursesResult = await api.getCourses(filters)

  async function createCourse() {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })

    return serverApi.createCourse()
  }

  async function archiveCourse(courseId: string) {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })

    return serverApi.archiveCourse(courseId)
  }

  return (
    <AdminCoursesPage
      archiveCourse={archiveCourse}
      coursesResult={coursesResult}
      createCourse={createCourse}
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
  return value === "active" || value === "archived" ? value : "all"
}

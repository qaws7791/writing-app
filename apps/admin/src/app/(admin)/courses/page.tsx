import { redirect } from "next/navigation"

import { parseAdminCourseListSearchParams } from "@/features/courses/admin-course-list-search-params"
import { AdminCoursesPage } from "@/features/courses/admin-courses-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getAdminLoginPath } from "@/lib/auth/admin-auth-navigation"

type CoursesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams
  const api = await getServerAdminApi()
  const courses = await api.listCourses(
    parseAdminCourseListSearchParams(params)
  )

  if (courses.status === "error") {
    redirect(getAdminLoginPath("/courses"))
  }

  return (
    <AdminCoursesPage
      courses={courses.value.courses}
      pagination={courses.value.pagination}
      query={courses.value.query}
    />
  )
}

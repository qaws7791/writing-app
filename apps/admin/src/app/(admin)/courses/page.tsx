import { redirect } from "next/navigation"

import { AdminCoursesPage } from "@/features/courses/admin-courses-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getAdminLoginPath } from "@/lib/auth/admin-auth-navigation"

export default async function CoursesPage() {
  const api = await getServerAdminApi()
  const courses = await api.listCourseTree()

  if (courses.status === "error") {
    redirect(getAdminLoginPath("/courses"))
  }

  return <AdminCoursesPage courses={courses.value.courses} />
}

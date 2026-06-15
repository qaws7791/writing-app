import { redirect } from "next/navigation"

import { CoursesPage } from "@/features/courses/courses-page"
import { createLoginPagePath } from "@/lib/auth/auth-navigation"
import { getServerLearnerSessionToken } from "@/lib/auth/server-session-token"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export default async function CoursesRoute() {
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    redirect(createLoginPagePath("/app/courses"))
  }

  const api = getServerWritingAppApi({
    tokenProvider: () => token,
  })
  const coursesResult = await api.listCourses()

  return (
    <CoursesPage
      courses={coursesResult.status === "ok" ? coursesResult.value : []}
    />
  )
}

import { redirect } from "next/navigation"

import { HomePage } from "@/features/home/home-page"
import type { ProgressCourseList } from "@/features/courses/course-types"
import { createLoginPagePath } from "@/lib/auth/auth-navigation"
import { getServerLearnerSessionToken } from "@/lib/auth/server-session-token"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

const emptyProgress: ProgressCourseList = {
  courses: [],
  currentStreakDays: 0,
}

export default async function AppHomeRoute() {
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    redirect(createLoginPagePath("/app"))
  }

  const api = getServerWritingAppApi({
    tokenProvider: () => token,
  })
  const [profileResult, progressResult] = await Promise.all([
    api.getProfile(),
    api.getProgress(),
  ])

  return (
    <HomePage
      learnerName={
        profileResult.status === "ok" ? profileResult.value.user.name : null
      }
      notice={
        progressResult.status === "error"
          ? progressResult.error.message
          : undefined
      }
      progress={
        progressResult.status === "ok" ? progressResult.value : emptyProgress
      }
    />
  )
}

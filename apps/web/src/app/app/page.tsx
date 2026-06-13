import { HomePage } from "@/features/home/home-page"
import type { ProgressCourseList } from "@/features/courses/course-types"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

const emptyProgress: ProgressCourseList = {
  courses: [],
  currentStreakDays: 0,
}

export default async function AppHomeRoute() {
  const api = getServerWritingAppApi({
    tokenProvider: () => null,
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

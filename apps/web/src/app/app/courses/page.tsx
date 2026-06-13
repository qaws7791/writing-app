import { CoursesPage } from "@/features/courses/courses-page"
import type { ProgressCourseList } from "@/features/courses/course-types"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

const emptyProgress: ProgressCourseList = {
  courses: [],
  currentStreakDays: 0,
}

export default async function CoursesRoute() {
  const api = getServerWritingAppApi({
    tokenProvider: () => null,
  })
  const [coursesResult, progressResult] = await Promise.all([
    api.listCourses(),
    api.getProgress(),
  ])

  return (
    <CoursesPage
      courses={coursesResult.status === "ok" ? coursesResult.value : []}
      progress={
        progressResult.status === "ok" ? progressResult.value : emptyProgress
      }
    />
  )
}

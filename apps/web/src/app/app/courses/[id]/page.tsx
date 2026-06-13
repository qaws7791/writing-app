import { notFound } from "next/navigation"

import { CourseDetailPage } from "@/features/courses/course-detail-page"
import { getServerLearnerSessionToken } from "@/lib/auth/server-session-token"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

type CourseDetailRouteProps = {
  readonly params: Promise<{
    readonly id: string
  }>
}

export default async function CourseDetailRoute({
  params,
}: CourseDetailRouteProps) {
  const { id } = await params
  const api = getServerWritingAppApi({
    tokenProvider: getServerLearnerSessionToken,
  })
  const [courseResult, progressResult] = await Promise.all([
    api.getCourseDetail(id),
    api.getProgress(),
  ])

  if (courseResult.status === "error") {
    notFound()
  }

  return (
    <CourseDetailPage
      course={courseResult.value}
      progressCourse={
        progressResult.status === "ok"
          ? progressResult.value.courses.find((course) => course.id === id)
          : undefined
      }
    />
  )
}

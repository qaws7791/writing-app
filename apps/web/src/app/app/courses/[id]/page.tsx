import { notFound, redirect } from "next/navigation"

import { CourseDetailPage } from "@/features/courses/course-detail-page"
import { createLoginPagePath } from "@/lib/auth/auth-navigation"
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
  const nextPath = `/app/courses/${id}`
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    redirect(createLoginPagePath(nextPath))
  }

  const api = getServerWritingAppApi({
    tokenProvider: () => token,
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

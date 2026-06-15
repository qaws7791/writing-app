import { notFound, redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
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
    if (courseResult.error.code === "not-found") {
      notFound()
    }

    return (
      <AppRouteNotice
        description="코스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        title="코스를 열 수 없습니다."
      />
    )
  }

  if (progressResult.status === "error") {
    return (
      <AppRouteNotice
        description="학습 진행 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        title="코스를 열 수 없습니다."
      />
    )
  }

  const course = courseResult.value

  if (course === undefined) {
    notFound()
  }

  const progressCourse = progressResult.value.courses.find(
    (item) => item.id === id
  )

  return <CourseDetailPage course={course} progressCourse={progressCourse} />
}

import { notFound, redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import { CourseDetailPage } from "@/features/courses/course-detail-page"
import {
  describeRouteApiFailure,
  toRouteApiOutcome,
} from "@/lib/api/route-api-outcome"
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
  const courseResult = await api.getCourseDetail(id)
  const courseOutcome = toRouteApiOutcome(courseResult)

  if (courseOutcome.status === "error") {
    if (courseOutcome.failure.kind === "authentication") {
      redirect(createLoginPagePath(nextPath))
    }

    if (courseOutcome.failure.kind === "not-found") {
      notFound()
    }

    return (
      <AppRouteNotice
        description={describeRouteApiFailure(courseOutcome.failure)}
        title="코스를 열 수 없습니다."
      />
    )
  }

  return <CourseDetailPage course={courseOutcome.value} />
}

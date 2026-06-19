import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import { CoursesPage } from "@/features/courses/courses-page"
import {
  describeRouteApiFailure,
  toRouteApiOutcome,
} from "@/lib/api/route-api-outcome"
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
  const coursesOutcome = toRouteApiOutcome(coursesResult)

  if (coursesOutcome.status === "error") {
    if (coursesOutcome.failure.kind === "authentication") {
      redirect(createLoginPagePath("/app/courses"))
    }

    return (
      <AppRouteNotice
        description={describeRouteApiFailure(coursesOutcome.failure)}
        title="코스 목록을 불러올 수 없습니다."
      />
    )
  }

  return <CoursesPage courses={coursesOutcome.value} />
}

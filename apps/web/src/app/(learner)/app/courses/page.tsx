import { redirect } from "next/navigation"
import { getCourses } from "@workspace/http-client/learner"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { CoursesPage } from "@/features/course-catalog/ui/courses-page"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

export default async function CoursesRoute() {
  const requestOptions = await getServerLearnerRequestOptions({
    cache: "no-store",
  })

  if (requestOptions === null) {
    redirect(createLoginPagePath("/app/courses"))
  }

  const coursesResult = await settleLearnerApiRequest(
    getCourses({}, requestOptions)
  )

  if (coursesResult.status === "error") {
    if (isLearnerApiAuthenticationError(coursesResult.error)) {
      redirect(createLoginPagePath("/app/courses"))
    }

    return (
      <AppRouteNotice
        description={coursesResult.error.message}
        title="코스 목록을 불러올 수 없습니다."
      />
    )
  }

  return (
    <CoursesPage
      courses={coursesResult.value.items}
      nextCursor={coursesResult.value.nextCursor}
    />
  )
}

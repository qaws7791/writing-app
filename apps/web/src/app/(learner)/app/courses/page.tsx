import { redirect } from "next/navigation"
import { getCourses } from "@workspace/http-client/learner"
import { courseCategoryValues } from "@workspace/contracts/content/category"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { CoursesPage } from "@/features/course-catalog/ui/courses-page"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
  type LearnerCourseSummaryDto,
} from "@/shared/http/learner-api-client"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

const catalogCategoryPageLimit = 100

export default async function CoursesRoute() {
  const requestOptions = await getServerLearnerRequestOptions({
    cache: "no-store",
  })

  if (requestOptions === null) {
    redirect(createLoginPagePath("/app/courses"))
  }

  const categoryPages = await Promise.all(
    courseCategoryValues.map((category) =>
      settleLearnerApiRequest(
        getCourses(
          {
            category,
            limit: catalogCategoryPageLimit,
          },
          requestOptions
        )
      )
    )
  )

  const courses: LearnerCourseSummaryDto[] = []

  for (const page of categoryPages) {
    if (page.status === "error") {
      if (isLearnerApiAuthenticationError(page.error)) {
        redirect(createLoginPagePath("/app/courses"))
      }

      return (
        <AppRouteNotice
          description={page.error.message}
          title="코스 목록을 불러올 수 없습니다."
        />
      )
    }

    courses.push(...page.value.items)
  }

  return <CoursesPage courses={courses} />
}

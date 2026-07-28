import { redirect } from "next/navigation"
import { getCourseCategories, getCourses } from "@workspace/http-client/learner"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { CoursesPage } from "@/features/course-catalog/ui/courses-page"
import { parseCourseListFilters } from "@/features/course-catalog/model/course-list-filters"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

export default async function CoursesRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [resolvedSearchParams, requestOptions] = await Promise.all([
    searchParams,
    getServerLearnerRequestOptions({ cache: "no-store" }),
  ])

  if (requestOptions === null) {
    redirect(createLoginPagePath("/app/courses"))
  }

  const filters = parseCourseListFilters(resolvedSearchParams)
  const [coursesResult, categoriesResult] = await Promise.all([
    settleLearnerApiRequest(
      getCourses(
        {
          ...(filters.category === "" ? {} : { category: filters.category }),
        },
        requestOptions
      )
    ),
    settleLearnerApiRequest(getCourseCategories(requestOptions)),
  ])
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

  if (categoriesResult.status === "error") {
    if (isLearnerApiAuthenticationError(categoriesResult.error)) {
      redirect(createLoginPagePath("/app/courses"))
    }

    return (
      <AppRouteNotice
        description={categoriesResult.error.message}
        title="코스 분류를 불러올 수 없습니다."
      />
    )
  }

  return (
    <CoursesPage
      categories={categoriesResult.value}
      courses={coursesResult.value.items}
      filters={filters}
      key={filters.category}
      nextCursor={coursesResult.value.nextCursor}
    />
  )
}

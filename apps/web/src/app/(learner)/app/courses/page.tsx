import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { CoursesPage } from "@/features/course-catalog/ui/courses-page"
import { parseCourseListFilters } from "@/features/course-catalog/model/course-list-filters"
import { getCourseCatalog } from "@/features/course-catalog/server/dal/get-course-catalog"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { getServerLearnerSessionToken } from "@/server/auth/server-session-token"

export default async function CoursesRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    redirect(createLoginPagePath("/app/courses"))
  }

  const filters = parseCourseListFilters(resolvedSearchParams)
  const { categoriesResult, coursesResult } = await getCourseCatalog({
    filters,
    sessionToken: token,
  })
  if (coursesResult.status === "error") {
    if (coursesResult.error.code === "UNAUTHENTICATED") {
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
    if (categoriesResult.error.code === "UNAUTHENTICATED") {
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
      key={`${filters.category}:${filters.query}:${filters.sort}`}
      nextCursor={coursesResult.value.nextCursor}
    />
  )
}

import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import {
  CoursesPage,
  type CourseListFilters,
} from "@/features/courses/courses-page"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"
import { createLoginPagePath } from "@/lib/auth/auth-navigation"
import { getServerLearnerSessionToken } from "@/lib/auth/server-session-token"

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

  const api = getServerWritingAppApi({
    tokenProvider: () => token,
  })
  const filters = readCourseListFilters(resolvedSearchParams)
  const [coursesResult, categoriesResult] = await Promise.all([
    api.listCourses({
      category: filters.category || undefined,
      query: filters.query || undefined,
      sort: filters.sort,
    }),
    api.getCourseCategories(),
  ])
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

function readCourseListFilters(
  searchParams: Record<string, string | string[] | undefined>
): CourseListFilters {
  return {
    category: readString(searchParams["category"], ""),
    query: readString(searchParams["query"], ""),
    sort: readCourseSort(readString(searchParams["sort"], "recommended")),
  }
}

function readString(value: string | string[] | undefined, fallback: string) {
  return typeof value === "string" ? value : fallback
}

function readCourseSort(value: string): CourseListFilters["sort"] {
  if (
    value === "title-asc" ||
    value === "title-desc" ||
    value === "lesson-count-desc" ||
    value === "lesson-count-asc"
  ) {
    return value
  }

  return "recommended"
}

import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import {
  CoursesPage,
  type CourseListFilters,
} from "@/features/courses/courses-page"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"
import {
  describeRouteApiFailure,
  toRouteApiOutcome,
} from "@/lib/api/route-api-outcome"
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

  return (
    <CoursesPage
      courses={coursesOutcome.value}
      filters={readCourseListFilters(resolvedSearchParams)}
    />
  )
}

function readCourseListFilters(
  searchParams: Record<string, string | string[] | undefined>
): CourseListFilters {
  return {
    category: readString(searchParams["category"], ""),
    query: readString(searchParams["query"], ""),
    sort: readCourseSort(readString(searchParams["sort"], "latest")),
  }
}

function readString(value: string | string[] | undefined, fallback: string) {
  return typeof value === "string" ? value : fallback
}

function readCourseSort(value: string): CourseListFilters["sort"] {
  if (value === "title" || value === "studyTime") {
    return value
  }

  return "latest"
}

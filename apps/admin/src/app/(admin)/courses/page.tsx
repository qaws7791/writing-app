import { redirect } from "next/navigation"

import type { AdminCourseListInputDto } from "@workspace/core/admin"

import { AdminCoursesPage } from "@/features/courses/admin-courses-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getAdminLoginPath } from "@/lib/auth/admin-auth-navigation"

type CoursesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const defaultPage = 1
const defaultPageSize = 10
const allowedPageSizes = [10, 20, 30, 40, 50] as const

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams
  const api = await getServerAdminApi()
  const courses = await api.listCourses({
    page: parsePositiveInteger(firstParam(params["page"]), defaultPage),
    pageSize: parsePageSize(firstParam(params["pageSize"])),
    query: firstParam(params["query"])?.trim() ?? "",
  })

  if (courses.status === "error") {
    redirect(getAdminLoginPath("/courses"))
  }

  return (
    <AdminCoursesPage
      courses={courses.value.courses}
      pagination={courses.value.pagination}
      query={courses.value.query}
    />
  )
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (value === undefined || !/^\d+$/.test(value)) {
    return fallback
  }

  const parsedValue = Number(value)

  return parsedValue > 0 ? parsedValue : fallback
}

function parsePageSize(
  value: string | undefined
): AdminCourseListInputDto["pageSize"] {
  const parsedValue = parsePositiveInteger(value, defaultPageSize)

  return isAllowedPageSize(parsedValue) ? parsedValue : defaultPageSize
}

function isAllowedPageSize(
  value: number
): value is AdminCourseListInputDto["pageSize"] {
  return allowedPageSizes.some((pageSize) => pageSize === value)
}

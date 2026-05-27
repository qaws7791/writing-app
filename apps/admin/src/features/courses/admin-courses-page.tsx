import * as React from "react"

import type { AdminCourseListDto } from "@workspace/core/admin"

import { AdminHeader } from "@/components/admin-header"
import { AdminCoursesDataTable } from "@/features/courses/admin-courses-data-table"

type AdminCoursesPageProps = {
  courses: AdminCourseListDto["courses"]
  pagination: AdminCourseListDto["pagination"]
  query: string
}

export function AdminCoursesPage({
  courses,
  pagination,
  query,
}: AdminCoursesPageProps) {
  return (
    <>
      <AdminHeader
        description="코스 목록을 검색하고 페이지 단위로 확인합니다."
        title="콘텐츠"
      />
      <main className="flex flex-col gap-6 p-6">
        <AdminCoursesDataTable
          courses={courses}
          pagination={pagination}
          query={query}
        />
      </main>
    </>
  )
}

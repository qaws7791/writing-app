import "server-only"

import type { CourseListFilters } from "@/features/course-catalog/model/course-list-filters"
import { getServerWritingAppApi } from "@/server/http/get-server-writing-app-api"

export async function getCourseCatalog({
  filters,
  sessionToken,
}: {
  readonly filters: CourseListFilters
  readonly sessionToken: string
}) {
  const api = getServerWritingAppApi({
    tokenProvider: () => sessionToken,
  })

  const [coursesResult, categoriesResult] = await Promise.all([
    api.listCourses({
      ...(filters.category === "" ? {} : { category: filters.category }),
      ...(filters.query === "" ? {} : { query: filters.query }),
      sort: filters.sort,
    }),
    api.getCourseCategories(),
  ])

  return { categoriesResult, coursesResult } as const
}

import { notFound } from "next/navigation"

import { CourseDetailPage } from "@/features/courses/course-detail-page"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

type CourseDetailRouteProps = {
  readonly params: Promise<{
    readonly id: string
  }>
}

export default async function CourseDetailRoute({
  params,
}: CourseDetailRouteProps) {
  const { id } = await params
  const api = getServerWritingAppApi({
    tokenProvider: () => null,
  })
  const [courseResult, progressResult] = await Promise.all([
    api.getCourseDetail(id),
    api.getProgress(),
  ])

  if (courseResult.status === "error") {
    notFound()
  }

  return (
    <CourseDetailPage
      course={courseResult.value}
      progressCourse={
        progressResult.status === "ok"
          ? progressResult.value.courses.find((course) => course.id === id)
          : undefined
      }
    />
  )
}

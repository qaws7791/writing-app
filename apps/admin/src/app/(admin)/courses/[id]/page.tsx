import { AdminCourseDetailPage } from "@/features/courses/admin-course-detail-page"

type CourseDetailRouteProps = {
  params: Promise<{
    id: string
  }>
}

export default async function CourseDetailRoute({
  params,
}: CourseDetailRouteProps) {
  const { id } = await params

  return <AdminCourseDetailPage courseId={id} />
}

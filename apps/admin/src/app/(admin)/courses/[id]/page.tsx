import { AdminCourseDetailPage } from "@/features/courses/admin-course-detail-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminCourseDetailRoute({
  params,
}: {
  readonly params: Promise<{
    readonly id: string
  }>
}) {
  const { id } = await params
  const api = getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  })
  const courseResult = await api.getCourseEditor(id)

  return <AdminCourseDetailPage courseResult={courseResult} />
}

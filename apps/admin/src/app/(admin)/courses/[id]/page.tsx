import { AdminCourseDetailPage } from "@/features/courses/admin-course-detail-page"
import { createAdminCoursesApi } from "@/features/courses/admin-courses-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import {
  readAdminCourseEditorAction,
  publishAdminCourseAction,
  saveAdminCourseEditorAction,
} from "@/features/courses/admin-course-actions"

export default async function AdminCourseDetailRoute({
  params,
}: {
  readonly params: Promise<{
    readonly id: string
  }>
}) {
  const { id } = await params
  const api = createAdminCoursesApi(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  )
  const courseResult = await api.getCourseEditor(id)

  return (
    <AdminCourseDetailPage
      courseResult={courseResult}
      loadLatestCourse={readAdminCourseEditorAction}
      publishCourse={publishAdminCourseAction}
      saveCourse={saveAdminCourseEditorAction}
    />
  )
}

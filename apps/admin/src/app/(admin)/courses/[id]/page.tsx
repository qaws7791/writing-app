import { AdminCourseDetailPage } from "@/features/course-editor/ui/admin-course-detail-page"
import { courseIdSchema } from "@/entities/course/model/course-id"
import { createAdminCourseEditorApi } from "@/features/course-editor/api/admin-course-editor-api"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import {
  publishAdminCourseAction,
  saveAdminCourseEditorAction,
} from "@/features/course-editor/server/admin-course-actions"
import { notFound } from "next/navigation"

export default async function AdminCourseDetailRoute({
  params,
}: {
  readonly params: Promise<{
    readonly id: string
  }>
}) {
  const parsedCourseId = courseIdSchema.safeParse((await params).id)
  if (!parsedCourseId.success) notFound()
  const api = createAdminCourseEditorApi(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  )
  const courseResult = await api.getCourseEditor(parsedCourseId.data)

  return (
    <AdminCourseDetailPage
      courseResult={courseResult}
      publishCourse={publishAdminCourseAction}
      saveCourse={saveAdminCourseEditorAction}
    />
  )
}

import { redirect } from "next/navigation"

import { AdminCourseDetailPage } from "@/features/courses/admin-course-detail-page"
import { parseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getAdminLoginPath } from "@/lib/auth/admin-auth-navigation"

type CourseDetailRouteProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CourseDetailRoute({
  params,
  searchParams,
}: CourseDetailRouteProps) {
  const { id } = await params
  const paramsRecord = await searchParams
  const urlState = parseEditorUrlState(toUrlSearchParams(paramsRecord))
  const api = await getServerAdminApi()

  const editorDocument = await api.getCourseEditorDocument(id)

  if (editorDocument.status === "error") {
    redirect(getAdminLoginPath(`/courses/${id}`))
  }

  return (
    <AdminCourseDetailPage
      adminApiBaseUrl={process.env["ADMIN_API_BASE_URL"]}
      course={editorDocument.value.course}
      revision={editorDocument.value.revision}
      curriculum={editorDocument.value.curriculum}
      urlState={urlState}
    />
  )
}

function toUrlSearchParams(
  params: Record<string, string | string[] | undefined>
) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    const firstValue = Array.isArray(value) ? value[0] : value

    if (firstValue !== undefined) {
      searchParams.set(key, firstValue)
    }
  }

  return searchParams
}

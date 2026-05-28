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

  const [course, versions] = await Promise.all([
    api.getCourseDetail(id),
    api.listCurriculumVersions(id),
  ])

  if (course.status === "error" || versions.status === "error") {
    redirect(getAdminLoginPath(`/courses/${id}`))
  }

  const selectedVersionId =
    urlState.versionId ??
    versions.value.versions.find((version) => version.status === "draft")?.id ??
    versions.value.versions[0]?.id

  if (!selectedVersionId) {
    redirect("/courses")
  }

  const version = await api.getCourseCurriculumVersionDetail(
    id,
    selectedVersionId
  )

  if (version.status === "error") {
    redirect(getAdminLoginPath(`/courses/${id}`))
  }

  return (
    <AdminCourseDetailPage
      course={course.value}
      selectedVersionId={selectedVersionId}
      urlState={{
        ...urlState,
        versionId: selectedVersionId,
      }}
      version={version.value}
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

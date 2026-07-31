import { AdminCourseDetailPage } from "@/features/course-editor/ui/admin-course-detail-page"
import { courseIdSchema } from "@/entities/course/model/course-id"
import {
  publishAdminCourseAction,
  saveAdminCourseEditorAction,
  uploadAdminContentAssetAction,
} from "@/features/course-editor/server/admin-course-actions"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import {
  getAdminCourseAssets,
  getAdminCourseEditor,
} from "@workspace/http-client/admin"
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
  const requestOptions = await getServerAdminRequestOptions()
  const [courseResult, assetsResult] =
    requestOptions === null
      ? ([
          unauthenticatedAdminRequestFailure(),
          unauthenticatedAdminRequestFailure(),
        ] as const)
      : await Promise.all([
          settleAdminApiRequest(
            getAdminCourseEditor(parsedCourseId.data, requestOptions)
          ),
          settleAdminApiRequest(
            getAdminCourseAssets(parsedCourseId.data, requestOptions)
          ),
        ])

  return (
    <AdminCourseDetailPage
      assetsResult={assetsResult}
      courseResult={courseResult}
      publishCourse={publishAdminCourseAction}
      saveCourse={saveAdminCourseEditorAction}
      uploadAdminContentAsset={uploadAdminContentAssetAction}
    />
  )
}

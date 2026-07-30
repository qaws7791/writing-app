import type {
  AdminContentAsset,
  AdminContentAssetKind,
  AdminCourseDetail,
} from "@/features/course-editor/model/admin-course-editor"
import type { CourseEditorAction } from "@/features/course-editor/model/course-editor-reducer"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"

export type UploadAdminContentAsset = (
  input: FormData
) => Promise<AdminRequestResult<AdminContentAsset>>

export type ContentAssetUpload = (
  input: Readonly<{
    altText: string
    file: File
    kind: AdminContentAssetKind
  }>
) => Promise<AdminRequestResult<AdminContentAsset>>

export function createContentAssetUpload(input: {
  readonly dispatch: (action: CourseEditorAction) => void
  readonly draft: AdminCourseDetail
  readonly uploadAdminContentAsset: UploadAdminContentAsset
}): ContentAssetUpload {
  return async ({ altText, file, kind }) => {
    const formData = new FormData()
    formData.set("altText", altText)
    formData.set("courseId", input.draft.id)
    formData.set("curriculumVersionId", input.draft.curriculumVersionId)
    formData.set("file", file)
    formData.set("kind", kind)
    const result = await input.uploadAdminContentAsset(formData)
    if (result.status === "ok") {
      input.dispatch({ asset: result.value, type: "asset-registered" })
    }
    return result
  }
}

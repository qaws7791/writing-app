import { CourseEditorShell } from "@/features/course-editor/ui/course-editor-shell"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type {
  AdminCourseAssets,
  AdminCourseDetail,
  AdminCourseEditorCommandResult,
} from "@/features/course-editor/model/admin-course-editor"
import type { UploadAdminContentAsset } from "@/features/course-editor/model/content-asset-upload"
import { AdminPageHeader } from "@/shared/ui/admin-page-header"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"

export function AdminCourseDetailPage({
  assetsResult,
  courseResult,
  publishCourse,
  saveCourse,
  uploadAdminContentAsset,
}: {
  readonly assetsResult: AdminRequestResult<AdminCourseAssets>
  readonly courseResult: AdminRequestResult<AdminCourseDetail>
  readonly publishCourse: (
    course: AdminCourseDetail
  ) => Promise<AdminCourseEditorCommandResult>
  readonly saveCourse: (
    course: AdminCourseDetail
  ) => Promise<AdminCourseEditorCommandResult>
  readonly uploadAdminContentAsset: UploadAdminContentAsset
}) {
  if (courseResult.status === "error") {
    return (
      <>
        <AdminPageHeader description="코스의 유닛, 레슨, 스텝을 편집합니다." />
        <Alert role="alert" variant="destructive">
          <AlertDescription>{courseResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  return (
    <CourseEditorShell
      assetsResult={assetsResult}
      course={courseResult.value}
      publishCourse={publishCourse}
      saveCourse={saveCourse}
      uploadAdminContentAsset={uploadAdminContentAsset}
    />
  )
}

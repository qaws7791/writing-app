import { CourseEditorShell } from "@/features/course-editor/ui/course-editor-shell"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type {
  AdminCourseDetail,
  AdminCourseEditorCommandResult,
} from "@/features/course-editor/model/admin-course-editor"
import type { UploadAdminContentAsset } from "@/features/course-editor/model/content-asset-upload"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { PageHeader } from "@workspace/ui/components/ui/page-header"

export function AdminCourseDetailPage({
  courseResult,
  publishCourse,
  saveCourse,
  uploadAdminContentAsset,
}: {
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
        <PageHeader
          description="코스의 유닛, 레슨, 스텝을 편집합니다."
          title="코스 편집"
        />
        <Alert role="alert" tone="danger">
          <AlertDescription>{courseResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  return (
    <CourseEditorShell
      course={courseResult.value}
      publishCourse={publishCourse}
      saveCourse={saveCourse}
      uploadAdminContentAsset={uploadAdminContentAsset}
    />
  )
}

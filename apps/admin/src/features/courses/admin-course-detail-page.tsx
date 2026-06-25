import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminCourseDetail } from "@/lib/api/admin-api"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { PageHeader } from "@workspace/ui/components/ui/page-header"

export function AdminCourseDetailPage({
  courseResult,
}: {
  readonly courseResult: AdminApiResult<AdminCourseDetail>
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

  return <CourseEditorShell course={courseResult.value} />
}

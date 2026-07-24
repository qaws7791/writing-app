import { CourseEditorShell } from "@/features/course-editor/ui/course-editor-shell"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type {
  AdminCourseDetail,
  AdminCoursePublishResult,
} from "@/features/course-editor/model/admin-course-editor"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { PageHeader } from "@workspace/ui/components/ui/page-header"

export function AdminCourseDetailPage({
  courseResult,
  publishCourse,
  saveCourse,
}: {
  readonly courseResult: AdminRequestResult<AdminCourseDetail>
  readonly publishCourse: (
    course: AdminCourseDetail
  ) => Promise<AdminRequestResult<AdminCoursePublishResult>>
  readonly saveCourse: (
    course: AdminCourseDetail
  ) => Promise<AdminRequestResult<AdminCourseDetail>>
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
    />
  )
}

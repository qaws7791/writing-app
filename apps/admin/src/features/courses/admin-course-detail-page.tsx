import { AdminHeader } from "@/components/admin-header"
import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminCourseDetail } from "@/lib/api/admin-api"

export function AdminCourseDetailPage({
  courseResult,
}: {
  readonly courseResult: AdminApiResult<AdminCourseDetail>
}) {
  if (courseResult.status === "error") {
    return (
      <>
        <AdminHeader
          description="코스의 유닛, 레슨, 스텝을 편집합니다."
          title="코스 편집"
        />
        <section className="admin-alert" role="alert">
          {courseResult.error.message}
        </section>
      </>
    )
  }

  return <CourseEditorShell course={courseResult.value} />
}

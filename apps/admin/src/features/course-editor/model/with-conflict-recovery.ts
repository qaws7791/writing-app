import type {
  AdminCourseDetail,
  AdminCourseEditorCommandResult,
} from "@/features/course-editor/model/admin-course-editor"
import type { CourseEditorAction } from "@/features/course-editor/model/course-editor-reducer"

export async function withConflictRecovery({
  dispatch,
  onSuccess,
  operation,
}: {
  readonly dispatch: (action: CourseEditorAction) => void
  readonly onSuccess: (value: AdminCourseDetail) => Promise<void>
  readonly operation: () => Promise<AdminCourseEditorCommandResult>
}): Promise<void> {
  const result = await operation()
  switch (result.status) {
    case "conflict":
      dispatch({ latest: result.latest, type: "conflict-detected" })
      return
    case "error":
      dispatch({ message: result.error.message, type: "server-failed" })
      return
    case "ok":
      await onSuccess(result.value)
  }
}

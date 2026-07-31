import type {
  AdminCourseDetail,
  AdminCourseEditorCommandResult,
} from "@/features/course-editor/model/admin-course-editor"
import type { CourseEditorAction } from "@/features/course-editor/model/course-editor-reducer"
import { isAdminRequestAuthenticationError } from "@/shared/http/admin-api-client"

const sessionExpiredMessage =
  "관리자 세션이 만료되어 저장하지 못했습니다. 다른 탭에서 다시 로그인한 뒤 저장하세요. 편집 내용은 이 화면에 남아 있습니다."

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
      dispatch({
        message: isAdminRequestAuthenticationError(result.error)
          ? sessionExpiredMessage
          : result.error.message,
        type: "server-failed",
      })
      return
    case "ok":
      await onSuccess(result.value)
  }
}

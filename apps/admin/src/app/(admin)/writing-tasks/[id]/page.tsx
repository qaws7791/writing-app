import { notFound } from "next/navigation"

import { writingTaskRouteIdSchema } from "@/features/writing-tasks/model/admin-writing-tasks"
import {
  publishAdminWritingTaskAction,
  saveAdminWritingTaskAction,
} from "@/features/writing-tasks/server/admin-writing-task-actions"
import { AdminWritingTaskEditorPage } from "@/features/writing-tasks/ui/admin-writing-task-editor-page"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { getAdminWritingTask } from "@workspace/http-client/admin"

export default async function AdminWritingTaskDetailRoute({
  params,
}: {
  readonly params: Promise<{
    readonly id: string
  }>
}) {
  const parsedId = writingTaskRouteIdSchema.safeParse((await params).id)
  if (!parsedId.success) notFound()

  const requestOptions = await getServerAdminRequestOptions()
  const taskResult =
    requestOptions === null
      ? unauthenticatedAdminRequestFailure()
      : await settleAdminApiRequest(
          getAdminWritingTask(parsedId.data, requestOptions)
        )

  return (
    <AdminWritingTaskEditorPage
      publishTask={publishAdminWritingTaskAction}
      saveTask={saveAdminWritingTaskAction}
      taskResult={taskResult}
    />
  )
}

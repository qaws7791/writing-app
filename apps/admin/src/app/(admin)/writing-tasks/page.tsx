import { parseAdminWritingTaskFilters } from "@/features/writing-tasks/model/admin-writing-task-filters"
import { createAdminWritingTaskAction } from "@/features/writing-tasks/server/admin-writing-task-actions"
import { AdminWritingTasksPage } from "@/features/writing-tasks/ui/admin-writing-tasks-page"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { getAdminWritingTasks } from "@workspace/http-client/admin"

export default async function AdminWritingTasksRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseAdminWritingTaskFilters(await searchParams)
  const requestOptions = await getServerAdminRequestOptions()
  const tasksResult =
    requestOptions === null
      ? unauthenticatedAdminRequestFailure()
      : await settleAdminApiRequest(
          getAdminWritingTasks(
            {
              page: filters.page,
              pageSize: filters.pageSize,
              query: filters.query,
              status: filters.status,
              ...(filters.domain === "all" ? {} : { domain: filters.domain }),
            },
            requestOptions
          )
        )

  return (
    <AdminWritingTasksPage
      createTask={createAdminWritingTaskAction}
      filters={filters}
      tasksResult={tasksResult}
    />
  )
}

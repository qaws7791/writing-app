import { AdminUsersPage } from "@/features/user-management/ui/admin-users-page"
import { parseAdminUserFilters } from "@/features/user-management/model/admin-user-filters"
import {
  deleteAdminUserAction,
  updateAdminUserStatusAction,
} from "@/features/user-management/server/admin-user-actions"
import {
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import { getAdminUsers } from "@workspace/http-client/admin"

export default async function AdminUsersRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseAdminUserFilters(await searchParams)
  const requestOptions = await getServerAdminRequestOptions()
  const usersResult =
    requestOptions === null
      ? unauthenticatedAdminRequestFailure()
      : await settleAdminApiRequest(getAdminUsers(filters, requestOptions))

  return (
    <AdminUsersPage
      deleteUser={deleteAdminUserAction}
      filters={filters}
      updateUserStatus={updateAdminUserStatusAction}
      usersResult={usersResult}
    />
  )
}

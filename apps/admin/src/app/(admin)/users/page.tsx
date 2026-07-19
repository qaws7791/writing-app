import { AdminUsersPage } from "@/features/user-management/ui/admin-users-page"
import { parseAdminUserFilters } from "@/features/user-management/model/admin-user-filters"
import {
  deleteAdminUserAction,
  updateAdminUserStatusAction,
} from "@/features/user-management/server/admin-user-actions"
import { createAdminUsersDal } from "@/features/user-management/server/admin-users-dal"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"

export default async function AdminUsersRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseAdminUserFilters(await searchParams)
  const usersResult = await createAdminUsersDal(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  ).getUsers(filters)

  return (
    <AdminUsersPage
      deleteUser={deleteAdminUserAction}
      filters={filters}
      updateUserStatus={updateAdminUserStatusAction}
      usersResult={usersResult}
    />
  )
}

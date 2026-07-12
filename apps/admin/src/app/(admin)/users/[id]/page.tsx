import { AdminUserDetailPage } from "@/features/users/admin-user-detail-page"
import { createAdminUsersApi } from "@/features/users/admin-users-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminUserDetailRoute({
  params,
}: {
  readonly params: Promise<{
    readonly id: string
  }>
}) {
  const { id } = await params
  const api = createAdminUsersApi(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  )
  const userResult = await api.getUser(id)

  return <AdminUserDetailPage userResult={userResult} />
}

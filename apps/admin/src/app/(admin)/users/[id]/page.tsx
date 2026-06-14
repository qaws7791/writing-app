import { AdminUserDetailPage } from "@/features/users/admin-user-detail-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminUserDetailRoute({
  params,
}: {
  readonly params: Promise<{
    readonly id: string
  }>
}) {
  const { id } = await params
  const api = getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  })
  const userResult = await api.getUser(id)

  return <AdminUserDetailPage userResult={userResult} />
}

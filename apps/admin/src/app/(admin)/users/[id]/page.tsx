import { AdminUserDetailPage } from "@/features/users/admin-user-detail-page"
import { createAdminUsersApi } from "@/features/users/admin-users-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { userIdSchema } from "@/lib/api/admin-identity"
import { notFound } from "next/navigation"

export default async function AdminUserDetailRoute({
  params,
}: {
  readonly params: Promise<{
    readonly id: string
  }>
}) {
  const parsedId = userIdSchema.safeParse((await params).id)
  if (!parsedId.success) notFound()
  const api = createAdminUsersApi(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  )
  const userResult = await api.getUser(parsedId.data)

  return <AdminUserDetailPage userResult={userResult} />
}

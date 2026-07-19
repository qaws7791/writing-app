import { AdminUserDetailPage } from "@/features/user-management/ui/admin-user-detail-page"
import { createAdminUsersDal } from "@/features/user-management/server/admin-users-dal"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { userIdSchema } from "@/entities/learner-account/model/learner-account-id"
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
  const api = createAdminUsersDal(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  )
  const userResult = await api.getUser(parsedId.data)

  return <AdminUserDetailPage userResult={userResult} />
}

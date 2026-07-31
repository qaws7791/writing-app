import { AdminUserDetailPage } from "@/features/user-management/ui/admin-user-detail-page"
import { userIdSchema } from "@/entities/learner-account/model/learner-account-id"
import {
  deleteAdminUserAction,
  updateAdminUserStatusAction,
} from "@/features/user-management/server/admin-user-actions"
import {
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import { getAdminUser } from "@workspace/http-client/admin"
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
  const requestOptions = await getServerAdminRequestOptions()
  const userResult =
    requestOptions === null
      ? unauthenticatedAdminRequestFailure()
      : await settleAdminApiRequest(getAdminUser(parsedId.data, requestOptions))

  return (
    <AdminUserDetailPage
      deleteUser={deleteAdminUserAction}
      updateUserStatus={updateAdminUserStatusAction}
      userResult={userResult}
    />
  )
}

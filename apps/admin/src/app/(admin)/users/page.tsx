import { redirect } from "next/navigation"

import { AdminUsersPage } from "@/features/users/admin-users-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getAdminLoginPath } from "@/lib/auth/admin-auth-navigation"

export default async function UsersPage() {
  const api = await getServerAdminApi()
  const users = await api.listUsers()

  if (users.status === "error" && users.httpStatus === 401) {
    redirect(getAdminLoginPath("/users"))
  }
  if (users.status === "error") {
    throw new Error(users.error.message)
  }

  return <AdminUsersPage users={users.value.users} />
}

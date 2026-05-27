import { redirect } from "next/navigation"

import { AdminUsersPage } from "@/features/users/admin-users-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getAdminLoginPath } from "@/lib/auth/admin-auth-navigation"

export default async function UsersPage() {
  const api = await getServerAdminApi()
  const users = await api.listUsers()

  if (users.status === "error") {
    redirect(getAdminLoginPath("/users"))
  }

  return <AdminUsersPage users={users.value.users} />
}

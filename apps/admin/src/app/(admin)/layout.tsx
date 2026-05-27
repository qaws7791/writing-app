import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin-shell"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getAdminLoginPath } from "@/lib/auth/admin-auth-navigation"

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const api = await getServerAdminApi()
  const users = await api.listUsers()

  if (users.status === "error") {
    redirect(getAdminLoginPath())
  }

  return <AdminShell>{children}</AdminShell>
}

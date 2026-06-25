import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin-shell"
import { createAdminLoginPath } from "@/lib/auth/admin-auth-navigation"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  const token = await getServerAdminSessionToken()

  if (token === null) {
    redirect(createAdminLoginPath("/"))
  }

  return <AdminShell>{children}</AdminShell>
}

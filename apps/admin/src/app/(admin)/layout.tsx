import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin-shell"
import { AdminServiceUnavailable } from "@/components/admin-service-unavailable"
import { isAdminAuthenticationError } from "@/lib/api/api-error"
import { createAdminLoginPath } from "@/lib/auth/admin-auth-navigation"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  const token = await getServerAdminSessionToken()

  if (token === null) {
    redirect(createAdminLoginPath("/"))
  }

  const sessionResult = await getServerAdminApi({
    tokenProvider: () => token,
  }).getSession()

  if (sessionResult.status === "error") {
    if (isAdminAuthenticationError(sessionResult.error)) {
      redirect(createAdminLoginPath("/"))
    }

    return <AdminServiceUnavailable retryHref="/" />
  }

  return <AdminShell>{children}</AdminShell>
}

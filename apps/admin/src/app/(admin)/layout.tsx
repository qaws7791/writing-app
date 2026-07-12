import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin-shell"
import { AdminServiceUnavailable } from "@/components/admin-service-unavailable"
import { createAdminSessionApi } from "@/features/auth/admin-session-api"
import { isAdminAuthenticationError } from "@/lib/api/api-error"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
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

  const sessionResult = await createAdminSessionApi(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  ).getSession()

  if (sessionResult.status === "error") {
    if (isAdminAuthenticationError(sessionResult.error)) {
      redirect(createAdminLoginPath("/"))
    }

    return <AdminServiceUnavailable retryHref="/" />
  }

  if (sessionResult.value.mfa.enrollmentRequired) {
    redirect("/mfa")
  }

  if (sessionResult.value.mfa.stepUpRequired) {
    redirect(createAdminLoginPath("/"))
  }

  return <AdminShell>{children}</AdminShell>
}

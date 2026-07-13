import type { ReactNode } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin-shell"
import { AdminServiceUnavailable } from "@/components/admin-service-unavailable"
import { createAdminSessionApi } from "@/features/auth/admin-session-api"
import { isAdminAuthenticationError } from "@/lib/api/api-error"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import {
  createAdminLoginPath,
  resolveSafeAdminNextPath,
} from "@/lib/auth/admin-auth-navigation"
import { adminRequestPathHeader } from "@/lib/auth/admin-request-path"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  const requestPath = resolveSafeAdminNextPath(
    (await headers()).get(adminRequestPathHeader) ?? "/"
  )
  const token = await getServerAdminSessionToken()

  if (token === null) {
    redirect(createAdminLoginPath(requestPath))
  }

  const sessionResult = await createAdminSessionApi(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  ).getSession()

  if (sessionResult.status === "error") {
    if (isAdminAuthenticationError(sessionResult.error)) {
      redirect(createAdminLoginPath(requestPath))
    }

    return <AdminServiceUnavailable retryHref={requestPath} />
  }

  if (sessionResult.value.mfa.enrollmentRequired) {
    redirect(`/mfa?next=${encodeURIComponent(requestPath)}`)
  }

  if (sessionResult.value.mfa.stepUpRequired) {
    redirect(createAdminLoginPath(requestPath))
  }

  return <AdminShell>{children}</AdminShell>
}

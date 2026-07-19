import type { ReactNode } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminShell } from "@/app/(admin)/_views/admin-shell"
import { AdminServiceUnavailable } from "@/app/(admin)/_views/admin-service-unavailable"
import { createAdminSessionDal } from "@/features/authentication/server/admin-session-dal"
import { isAdminAuthenticationError } from "@/shared/http/admin-api-error"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import {
  createAdminLoginPath,
  resolveSafeAdminNextPath,
} from "@/features/authentication/model/admin-auth-navigation"
import { adminRequestPathHeader } from "@/shared/auth/admin-request-path"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import {
  readAdminApiBaseUrl,
  readLearnerWebOrigin,
} from "@/shared/config/admin-runtime-config"

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

  const sessionResult = await createAdminSessionDal(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  ).getSession()

  if (sessionResult.status === "error") {
    if (isAdminAuthenticationError(sessionResult.error)) {
      redirect(createAdminLoginPath(requestPath))
    }

    return <AdminServiceUnavailable retryHref={requestPath} />
  }

  return (
    <AdminShell
      apiBaseUrl={readAdminApiBaseUrl()}
      learnerWebOrigin={readLearnerWebOrigin()}
    >
      {children}
    </AdminShell>
  )
}

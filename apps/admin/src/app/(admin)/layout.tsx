import type { ReactNode } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminShell } from "@/app/(admin)/_views/admin-shell"
import { AdminServiceUnavailable } from "@/app/(admin)/_views/admin-service-unavailable"
import {
  isAdminRequestAuthenticationError,
  settleAdminApiRequest,
} from "@/shared/http/admin-api-client"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  createAdminLoginPath,
  resolveSafeAdminNextPath,
} from "@/features/authentication/model/admin-auth-navigation"
import { adminRequestPathHeader } from "@/shared/auth/admin-request-path"
import { readLearnerWebOrigin } from "@/shared/config/admin-runtime-config"
import { getAdminSession } from "@workspace/http-client/admin"

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  const requestPath = resolveSafeAdminNextPath(
    (await headers()).get(adminRequestPathHeader) ?? "/"
  )
  const requestOptions = await getServerAdminRequestOptions()

  if (requestOptions === null) {
    redirect(createAdminLoginPath(requestPath))
  }

  const sessionResult = await settleAdminApiRequest(
    getAdminSession(requestOptions)
  )

  if (sessionResult.status === "error") {
    if (isAdminRequestAuthenticationError(sessionResult.error)) {
      redirect(createAdminLoginPath(requestPath))
    }

    return <AdminServiceUnavailable retryHref={requestPath} />
  }

  return (
    <AdminShell learnerWebOrigin={readLearnerWebOrigin()}>
      {children}
    </AdminShell>
  )
}

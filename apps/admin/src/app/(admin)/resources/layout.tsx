import { Suspense, type ReactNode } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { ResourceWorkspace } from "@/features/resource-library/ui/resource-workspace"
import { resolveResourceLibraryScope } from "@/features/resource-library/model/resource-library-scope"
import { createResourceLibraryHttpAdapter } from "@/features/resource-library/api/resource-library-http-adapter"
import { createAdminSessionDal } from "@/features/authentication/server/admin-session-dal"
import { AdminServiceUnavailable } from "@/app/(admin)/_views/admin-service-unavailable"
import { isAdminAuthenticationError } from "@/shared/http/admin-api-error"
import type { AdminResourceTree } from "@/entities/resource-document/model/resource-document"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import {
  createAdminLoginPath,
  resolveSafeAdminNextPath,
} from "@/features/authentication/model/admin-auth-navigation"
import { adminRequestPathHeader } from "@/shared/auth/admin-request-path"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { readServerApiBaseUrl } from "@/server/env/admin-runtime-config"
import { Spinner } from "@workspace/ui/components/ui/spinner"

export default async function ResourceLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  const requestPath = resolveSafeAdminNextPath(
    (await headers()).get(adminRequestPathHeader) ?? "/resources"
  )
  const token = await getServerAdminSessionToken()
  const initialScope = resolveResourceLibraryScope(requestPath)

  if (token === null) {
    redirect(createAdminLoginPath(requestPath))
  }

  const transport = getServerAdminHttpTransport({ tokenProvider: () => token })
  const sessionApi = createAdminSessionDal(transport)
  const resourceApi = createResourceLibraryHttpAdapter(transport)
  const [sessionResult, treeResult] = await Promise.all([
    sessionApi.getSession(),
    resourceApi.getResourceTree(initialScope),
  ])

  if (sessionResult.status === "error") {
    if (isAdminAuthenticationError(sessionResult.error)) {
      redirect(createAdminLoginPath(requestPath))
    }

    return <AdminServiceUnavailable retryHref={requestPath} />
  }

  const initialTree: AdminResourceTree | null =
    treeResult.status === "ok" ? treeResult.value : null

  return (
    <Suspense fallback={<ResourceWorkspaceFallback />}>
      <ResourceWorkspace
        apiBaseUrl={readServerApiBaseUrl()}
        initialScope={initialScope}
        initialTree={initialTree}
      >
        {children}
      </ResourceWorkspace>
    </Suspense>
  )
}

function ResourceWorkspaceFallback() {
  return (
    <div
      className="flex min-h-0 flex-1 items-center justify-center"
      role="status"
    >
      <Spinner aria-hidden="true" />
      <span className="ml-2 text-sm text-muted-foreground">
        자료실을 불러오는 중입니다.
      </span>
    </div>
  )
}

import { Suspense, type ReactNode } from "react"
import { redirect } from "next/navigation"

import { ResourceWorkspace } from "@/features/resources/resource-workspace"
import { createResourceLibraryHttpAdapter } from "@/features/resources/resource-library-http-adapter"
import { createAdminSessionApi } from "@/features/auth/admin-session-api"
import { AdminServiceUnavailable } from "@/components/admin-service-unavailable"
import { isAdminAuthenticationError } from "@/lib/api/api-error"
import type { InitialResourceTreeState } from "@/features/resources/tree/resource-tree"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { createAdminLoginPath } from "@/lib/auth/admin-auth-navigation"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { readServerAdminApiBaseUrl } from "@/runtime-config-server"
import { Spinner } from "@workspace/ui/components/ui/spinner"

export default async function ResourceLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  const token = await getServerAdminSessionToken()

  if (token === null) {
    redirect(createAdminLoginPath("/resources"))
  }

  const transport = getServerAdminHttpTransport({ tokenProvider: () => token })
  const sessionApi = createAdminSessionApi(transport)
  const resourceApi = createResourceLibraryHttpAdapter(transport)
  const [sessionResult, treeResult] = await Promise.all([
    sessionApi.getSession(),
    resourceApi.getResourceTree({ parentId: null, scope: "active" }),
  ])

  if (sessionResult.status === "error") {
    if (isAdminAuthenticationError(sessionResult.error)) {
      redirect(createAdminLoginPath("/resources"))
    }

    return <AdminServiceUnavailable retryHref="/resources" />
  }

  const initialTree: InitialResourceTreeState =
    treeResult.status === "ok"
      ? treeResult
      : { status: "error", message: treeResult.error.message }

  return (
    <Suspense fallback={<ResourceWorkspaceFallback />}>
      <ResourceWorkspace
        adminId={sessionResult.value.admin.id}
        apiBaseUrl={readServerAdminApiBaseUrl()}
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

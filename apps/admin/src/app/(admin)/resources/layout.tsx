import { Suspense, type ReactNode } from "react"
import { redirect } from "next/navigation"

import { ResourceWorkspace } from "@/features/resources/resource-workspace"
import type { InitialResourceTreeState } from "@/features/resources/tree/resource-tree"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { createAdminLoginPath } from "@/lib/auth/admin-auth-navigation"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { readAdminApiBaseUrl } from "@/runtime-config"
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

  const api = getServerAdminApi({ tokenProvider: () => token })
  const [sessionResult, treeResult] = await Promise.all([
    api.getSession(),
    api.getResourceTree({ parentId: null, scope: "active" }),
  ])

  if (sessionResult.status === "error") {
    redirect(createAdminLoginPath("/resources"))
  }

  const initialTree: InitialResourceTreeState =
    treeResult.status === "ok"
      ? treeResult
      : { status: "error", message: treeResult.error.message }

  return (
    <Suspense fallback={<ResourceWorkspaceFallback />}>
      <ResourceWorkspace
        adminId={sessionResult.value.admin.id}
        apiBaseUrl={readAdminApiBaseUrl()}
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

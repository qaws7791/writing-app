"use client"

import { useEffect, useMemo, type ReactNode } from "react"

import type { ResourceWorkspaceSyncApi } from "@/features/resources/resource-library-api"
import type { ResourceWorkspaceRealtime } from "@/features/resources/resource-workspace-realtime"
import { createResourceWorkspaceSync } from "@/features/resources/resource-workspace-sync"
import { ResourceWorkspaceSyncProvider } from "@/features/resources/resource-workspace-sync-context"

export function ResourceDocumentSyncBoundary({
  api,
  children,
  realtime,
}: {
  readonly api: ResourceWorkspaceSyncApi
  readonly children: ReactNode
  readonly realtime: ResourceWorkspaceRealtime
}) {
  const workspaceSync = useMemo(
    () => createResourceWorkspaceSync({ api, realtime }),
    [api, realtime]
  )

  useEffect(() => {
    function checkVisibleDocument(): void {
      if (document.visibilityState === "visible") {
        workspaceSync.checkActiveDocument()
      }
    }

    workspaceSync.start()
    document.addEventListener("visibilitychange", checkVisibleDocument)
    return () => {
      document.removeEventListener("visibilitychange", checkVisibleDocument)
      workspaceSync.dispose()
    }
  }, [workspaceSync])

  return (
    <ResourceWorkspaceSyncProvider sync={workspaceSync}>
      {children}
    </ResourceWorkspaceSyncProvider>
  )
}

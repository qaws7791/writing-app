"use client"

import { createContext, useContext, type ReactNode } from "react"

import type { ResourceWorkspaceSync } from "@/features/resources/resource-workspace-sync"

const ResourceWorkspaceSyncContext =
  createContext<ResourceWorkspaceSync | null>(null)

export function ResourceWorkspaceSyncProvider({
  children,
  sync,
}: {
  readonly children: ReactNode
  readonly sync: ResourceWorkspaceSync
}) {
  return (
    <ResourceWorkspaceSyncContext value={sync}>
      {children}
    </ResourceWorkspaceSyncContext>
  )
}

export function useResourceWorkspaceSync(): ResourceWorkspaceSync {
  const sync = useContext(ResourceWorkspaceSyncContext)
  if (sync === null) {
    throw new Error(
      "자료 문서 편집기는 자료실 작업 공간 안에서 사용해야 합니다."
    )
  }
  return sync
}

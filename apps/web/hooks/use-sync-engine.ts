"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { DraftContent } from "@workspace/core"

import {
  createSyncEngine,
  type DocumentUpdate,
  type SyncEngine,
} from "@/lib/sync/sync-engine"
import { createSyncTransport } from "@/lib/sync/sync-transport"
import type { Operation } from "@/lib/sync/types"

export type SyncStatus =
  | "idle"
  | "debouncing"
  | "syncing"
  | "retrying"
  | "resolving"
  | "error"

type UseSyncEngineOptions = {
  draftId: number
  baseVersion: number
  apiBaseUrl: string
  onDocumentUpdate?: (update: DocumentUpdate) => void
  enabled?: boolean
}

type UseSyncEngineReturn = {
  syncStatus: SyncStatus
  pushChange: (
    operations: Operation[],
    title: string,
    content: DraftContent
  ) => void
  forcePull: () => void
}

export function useSyncEngine(
  options: UseSyncEngineOptions
): UseSyncEngineReturn {
  const {
    draftId,
    baseVersion,
    apiBaseUrl,
    onDocumentUpdate,
    enabled = true,
  } = options

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const engineRef = useRef<SyncEngine | null>(null)
  const onDocumentUpdateRef = useRef(onDocumentUpdate)

  // 콜백 ref 최신 유지
  useEffect(() => {
    onDocumentUpdateRef.current = onDocumentUpdate
  }, [onDocumentUpdate])

  // 엔진 초기화
  useEffect(() => {
    if (!enabled) return

    const transport = createSyncTransport({ baseUrl: apiBaseUrl })
    const engine = createSyncEngine({ draftId, baseVersion, transport })

    engine.onStateChange((state) => {
      setSyncStatus(state as SyncStatus)
    })

    engine.onDocumentUpdate((update) => {
      onDocumentUpdateRef.current?.(update)
    })

    engineRef.current = engine

    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [draftId, baseVersion, apiBaseUrl, enabled])

  const pushChange = useCallback(
    (operations: Operation[], title: string, content: DraftContent) => {
      engineRef.current?.pushLocalChange(operations, title, content)
    },
    []
  )

  const forcePull = useCallback(() => {
    engineRef.current?.pull()
  }, [])

  return { syncStatus, pushChange, forcePull }
}

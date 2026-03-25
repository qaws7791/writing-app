"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  createSyncTransport,
  type SyncTransport,
} from "@/features/writing/sync/sync-transport"
import type {
  VersionDetail,
  VersionSummary,
} from "@/features/writing/sync/types"
import { env } from "@/foundation/config/env"
import { resolveBrowserApiBaseUrl } from "@/foundation/lib/api-base-url"

export type VersionHistoryState = {
  versions: VersionSummary[]
  selectedDetail: VersionDetail | null
  loading: boolean
  detailLoading: boolean
  error: string | null
  restoring: boolean
}

type UseVersionHistoryOptions = {
  draftId: number
  open: boolean
  onRestoreComplete?: (detail: VersionDetail) => void
}

function resolveApiBaseUrl(): string {
  const envBaseUrl = env.NEXT_PUBLIC_API_BASE_URL
  if (!envBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required.")
  }
  return resolveBrowserApiBaseUrl(envBaseUrl)
}

export function useVersionHistory({
  draftId,
  open,
  onRestoreComplete,
}: UseVersionHistoryOptions) {
  const [state, setState] = useState<VersionHistoryState>({
    versions: [],
    selectedDetail: null,
    loading: false,
    detailLoading: false,
    error: null,
    restoring: false,
  })

  const onRestoreCompleteRef = useRef(onRestoreComplete)
  useEffect(() => {
    onRestoreCompleteRef.current = onRestoreComplete
  }, [onRestoreComplete])

  const transport = useMemo<SyncTransport>(
    () => createSyncTransport({ baseUrl: resolveApiBaseUrl() }),
    []
  )

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    async function loadVersions() {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const response = await transport.listVersions(draftId, 50)

        if (cancelled) return

        setState((prev) => ({
          ...prev,
          versions: response.items,
          loading: false,
        }))
      } catch {
        if (cancelled) return

        setState((prev) => ({
          ...prev,
          loading: false,
          error: "버전 기록을 불러올 수 없습니다.",
        }))
      }
    }

    void loadVersions()

    return () => {
      cancelled = true
    }
  }, [draftId, open, transport])

  const selectVersion = useCallback(
    async (version: number) => {
      setState((prev) => ({ ...prev, detailLoading: true }))

      try {
        const detail = await transport.getVersion(draftId, version)

        setState((prev) => ({
          ...prev,
          selectedDetail: detail,
          detailLoading: false,
        }))
      } catch {
        setState((prev) => ({
          ...prev,
          detailLoading: false,
          error: "이 버전을 불러올 수 없습니다.",
        }))
      }
    },
    [draftId, transport]
  )

  const restoreVersion = useCallback(
    async (version: number) => {
      const detail = state.selectedDetail
      if (!detail || detail.version !== version) return

      setState((prev) => ({ ...prev, restoring: true }))

      try {
        await transport.push(draftId, {
          baseVersion: version,
          transactions: [
            {
              operations: [
                { type: "setTitle", title: detail.title },
                { type: "setContent", content: detail.content },
              ],
              createdAt: new Date().toISOString(),
            },
          ],
          restoreFrom: version,
        })

        setState((prev) => ({ ...prev, restoring: false }))
        onRestoreCompleteRef.current?.(detail)
      } catch {
        setState((prev) => ({
          ...prev,
          restoring: false,
          error: "복원에 실패했습니다. 다시 시도해 주세요.",
        }))
      }
    },
    [draftId, state.selectedDetail, transport]
  )

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    selectVersion,
    restoreVersion,
    retry,
  }
}

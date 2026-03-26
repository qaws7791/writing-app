"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import {
  createVersionDataSource,
  type VersionDataSource,
} from "@/features/writing/repositories/version-data-source"
import { versionQueryKeys } from "@/features/writing/hooks/writing-query-keys"
import type { VersionDetail } from "@/features/writing/sync/types"

type UseVersionHistoryOptions = {
  dataSource?: VersionDataSource
  writingId: number
  onRestoreComplete?: (detail: VersionDetail) => void
  open: boolean
}

export function useVersionHistory({
  dataSource,
  writingId,
  onRestoreComplete,
  open,
}: UseVersionHistoryOptions) {
  const sourceRef = useRef(dataSource)

  useEffect(() => {
    sourceRef.current = dataSource
  }, [dataSource])

  function getSource(): VersionDataSource {
    return sourceRef.current ?? createVersionDataSource()
  }

  const onRestoreCompleteRef = useRef(onRestoreComplete)
  useEffect(() => {
    onRestoreCompleteRef.current = onRestoreComplete
  }, [onRestoreComplete])

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [prevOpen, setPrevOpen] = useState(open)

  if (prevOpen !== open) {
    setPrevOpen(open)
    if (!open) {
      setSelectedVersion(null)
    }
  }

  const versionsQuery = useQuery({
    queryKey: versionQueryKeys.list(writingId),
    queryFn: () => getSource().listVersions(writingId, { limit: 50 }),
    enabled: open,
    select: (data) => data.items,
  })

  const detailQuery = useQuery({
    queryKey: versionQueryKeys.detail(writingId, selectedVersion ?? -1),
    queryFn: () => getSource().getVersion(writingId, selectedVersion!),
    enabled: open && selectedVersion !== null,
  })

  const restoreMutation = useMutation({
    mutationFn: async (version: number) => {
      const detail = detailQuery.data
      if (!detail || detail.version !== version) {
        throw new Error("선택된 버전이 일치하지 않습니다.")
      }

      await getSource().push(writingId, {
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

      return detail
    },
    onSuccess: (detail) => {
      onRestoreCompleteRef.current?.(detail)
    },
  })

  const selectVersion = useCallback((version: number) => {
    setSelectedVersion(version)
  }, [])

  const restoreVersion = useCallback(
    (version: number) => {
      restoreMutation.mutate(version)
    },
    [restoreMutation]
  )

  function resolveErrorMessage(): string | null {
    if (restoreMutation.isError)
      return "복원에 실패했습니다. 다시 시도해 주세요."
    if (detailQuery.isError) return "이 버전을 불러올 수 없습니다."
    if (versionsQuery.isError) return "버전 기록을 불러올 수 없습니다."
    return null
  }

  const retry = useCallback(() => {
    if (versionsQuery.isError) {
      void versionsQuery.refetch()
    }
    if (detailQuery.isError) {
      void detailQuery.refetch()
    }
    if (restoreMutation.isError) {
      restoreMutation.reset()
    }
  }, [versionsQuery, detailQuery, restoreMutation])

  return {
    detailLoading: detailQuery.isLoading,
    error: resolveErrorMessage(),
    loading: versionsQuery.isLoading,
    restoreVersion,
    restoring: restoreMutation.isPending,
    retry,
    selectVersion,
    selectedDetail: detailQuery.data ?? null,
    versions: versionsQuery.data ?? [],
  }
}

"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { DraftSummary } from "@/domain/draft"
import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"
import {
  createDraftListDataSource,
  type DraftListDataSource,
} from "@/features/writing/repositories/draft-list-data-source"

export function useDraftListQuery(dataSource?: DraftListDataSource) {
  const source = useMemo(
    () => dataSource ?? createDraftListDataSource(),
    [dataSource]
  )

  return useQuery<DraftSummary[]>({
    queryKey: draftQueryKeys.list(),
    queryFn: () => source.listDrafts(),
  })
}

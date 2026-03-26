"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { DraftDetail } from "@/domain/draft"
import {
  createDraftDataSource,
  type DraftDataSource,
} from "@/features/writing/repositories/draft-data-source"
import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"

export function useDraftDetailQuery(
  draftId: number,
  dataSource?: DraftDataSource
) {
  const source = useMemo(
    () => dataSource ?? createDraftDataSource(),
    [dataSource]
  )

  return useQuery<DraftDetail>({
    queryKey: draftQueryKeys.detail(draftId),
    queryFn: () => source.getDraft(draftId),
  })
}

"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { PromptDetail } from "@/domain/prompt"
import {
  createDraftDataSource,
  type DraftDataSource,
} from "@/features/writing/repositories/draft-data-source"
import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"

export function useDraftPromptQuery(
  draftId: number,
  sourcePromptId: number | null,
  dataSource?: DraftDataSource
) {
  const source = useMemo(
    () => dataSource ?? createDraftDataSource(),
    [dataSource]
  )

  return useQuery<PromptDetail>({
    queryKey: draftQueryKeys.prompt(draftId),
    queryFn: () => source.getPrompt(sourcePromptId!),
    enabled: sourcePromptId !== null,
  })
}

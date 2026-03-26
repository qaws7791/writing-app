"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import type { DraftContent } from "@/domain/draft"
import {
  createDraftDataSource,
  type DraftDataSource,
} from "@/features/writing/repositories/draft-data-source"
import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"

type AutosaveInput = {
  content: DraftContent
  draftId: number
  title: string
}

export function useAutosaveDraftMutation(dataSource?: DraftDataSource) {
  const source = useMemo(
    () => dataSource ?? createDraftDataSource(),
    [dataSource]
  )
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ draftId, content, title }: AutosaveInput) => {
      return source.autosaveDraft(draftId, { content, title })
    },
    onSuccess: (result, { draftId }) => {
      queryClient.setQueryData(draftQueryKeys.detail(draftId), result.draft)
    },
  })
}

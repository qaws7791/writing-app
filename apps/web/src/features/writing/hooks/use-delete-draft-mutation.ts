"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import {
  createDraftDataSource,
  type DraftDataSource,
} from "@/features/writing/repositories/draft-data-source"
import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"

export function useDeleteDraftMutation(dataSource?: DraftDataSource) {
  const source = useMemo(
    () => dataSource ?? createDraftDataSource(),
    [dataSource]
  )
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draftId: number) => source.deleteDraft(draftId),
    onSuccess: (_data, draftId) => {
      queryClient.removeQueries({ queryKey: draftQueryKeys.detail(draftId) })
    },
  })
}

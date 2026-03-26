"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import {
  createDraftRepository,
  type DraftRepository,
} from "@/features/writing/repositories/draft-repository"
import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"

export function useDeleteDraftMutation(repository?: DraftRepository) {
  const repo = useMemo(
    () => repository ?? createDraftRepository(),
    [repository]
  )
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draftId: number) => repo.deleteDraft(draftId),
    onSuccess: (_data, draftId) => {
      queryClient.removeQueries({ queryKey: draftQueryKeys.detail(draftId) })
    },
  })
}

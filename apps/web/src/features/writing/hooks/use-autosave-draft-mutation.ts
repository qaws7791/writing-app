"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import type { DraftContent } from "@/domain/draft"
import {
  createDraftRepository,
  type DraftRepository,
} from "@/features/writing/repositories/draft-repository"
import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"

type AutosaveInput = {
  content: DraftContent
  draftId: number
  title: string
}

export function useAutosaveDraftMutation(repository?: DraftRepository) {
  const repo = useMemo(
    () => repository ?? createDraftRepository(),
    [repository]
  )
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ draftId, content, title }: AutosaveInput) => {
      return repo.autosaveDraft(draftId, { content, title })
    },
    onSuccess: (result, { draftId }) => {
      queryClient.setQueryData(draftQueryKeys.detail(draftId), result.draft)
    },
  })
}

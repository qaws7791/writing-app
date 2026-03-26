"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"
import {
  createDraftRepository,
  type CreateDraftInput,
  type DraftRepository,
} from "@/features/writing/repositories/draft-repository"

export function useCreateDraftMutation(repository?: DraftRepository) {
  const repo = useMemo(
    () => repository ?? createDraftRepository(),
    [repository]
  )
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDraftInput) => repo.createDraft(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: draftQueryKeys.list() })
    },
  })
}

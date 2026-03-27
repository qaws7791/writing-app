"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { WritingContent } from "@/domain/writing"
import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"
import { useWritingRepository } from "@/features/writing/hooks/use-writing-repository"
import type { WritingRepository } from "@/features/writing/repositories/writing-repository"

type AutosaveInput = {
  content: WritingContent
  writingId: number
  title: string
}

export function useAutosaveWritingMutation(repository?: WritingRepository) {
  const repo = useWritingRepository(repository)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ writingId, content, title }: AutosaveInput) => {
      return repo.autosaveWriting(writingId, { content, title })
    },
    onSuccess: (result, { writingId }) => {
      queryClient.setQueryData(
        writingQueryKeys.detail(writingId),
        result.writing
      )
    },
  })
}

"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import type { WritingContent } from "@/domain/writing"
import {
  createWritingRepository,
  type WritingRepository,
} from "@/features/writing/repositories/writing-repository"
import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"

type AutosaveInput = {
  content: WritingContent
  writingId: number
  title: string
}

export function useAutosaveWritingMutation(repository?: WritingRepository) {
  const repo = useMemo(
    () => repository ?? createWritingRepository(),
    [repository]
  )
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

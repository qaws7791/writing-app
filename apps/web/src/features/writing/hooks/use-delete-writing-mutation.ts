"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"
import { useWritingRepository } from "@/features/writing/hooks/use-writing-repository"
import type { WritingRepository } from "@/features/writing/repositories/writing-repository"

export function useDeleteWritingMutation(repository?: WritingRepository) {
  const repo = useWritingRepository(repository)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (writingId: number) => repo.deleteWriting(writingId),
    onSuccess: (_data, writingId) => {
      queryClient.removeQueries({
        queryKey: writingQueryKeys.detail(writingId),
      })
    },
  })
}

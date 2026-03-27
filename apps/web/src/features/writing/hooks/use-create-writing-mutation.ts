"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"
import { useWritingRepository } from "@/features/writing/hooks/use-writing-repository"
import type {
  CreateWritingInput,
  WritingRepository,
} from "@/features/writing/repositories/writing-repository"

export function useCreateWritingMutation(repository?: WritingRepository) {
  const repo = useWritingRepository(repository)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateWritingInput) => repo.createWriting(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: writingQueryKeys.list() })
    },
  })
}

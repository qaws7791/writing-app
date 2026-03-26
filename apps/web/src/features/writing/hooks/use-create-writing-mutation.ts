"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"
import {
  createWritingRepository,
  type CreateWritingInput,
  type WritingRepository,
} from "@/features/writing/repositories/writing-repository"

export function useCreateWritingMutation(repository?: WritingRepository) {
  const repo = useMemo(
    () => repository ?? createWritingRepository(),
    [repository]
  )
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateWritingInput) => repo.createWriting(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: writingQueryKeys.list() })
    },
  })
}

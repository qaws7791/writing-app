"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import {
  createWritingRepository,
  type WritingRepository,
} from "@/features/writing/repositories/writing-repository"
import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"

export function useDeleteWritingMutation(repository?: WritingRepository) {
  const repo = useMemo(
    () => repository ?? createWritingRepository(),
    [repository]
  )
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

"use client"

import { useQuery } from "@tanstack/react-query"

import type { WritingSummary } from "@/domain/writing"
import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"
import { useWritingRepository } from "@/features/writing/hooks/use-writing-repository"
import type { WritingRepository } from "@/features/writing/repositories/writing-repository"

export function useWritingListQuery(repository?: WritingRepository) {
  const repo = useWritingRepository(repository)

  return useQuery<WritingSummary[]>({
    queryKey: writingQueryKeys.list(),
    queryFn: () => repo.listWritings(),
  })
}

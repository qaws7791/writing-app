"use client"

import { useQuery } from "@tanstack/react-query"

import type { WritingDetail } from "@/domain/writing"
import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"
import { useWritingRepository } from "@/features/writing/hooks/use-writing-repository"
import type { WritingRepository } from "@/features/writing/repositories/writing-repository"

export function useWritingDetailQuery(
  writingId: number,
  repository?: WritingRepository
) {
  const repo = useWritingRepository(repository)

  return useQuery<WritingDetail>({
    queryKey: writingQueryKeys.detail(writingId),
    queryFn: () => repo.getWriting(writingId),
  })
}

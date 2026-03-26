"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { WritingDetail } from "@/domain/writing"
import {
  createWritingRepository,
  type WritingRepository,
} from "@/features/writing/repositories/writing-repository"
import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"

export function useWritingDetailQuery(
  writingId: number,
  repository?: WritingRepository
) {
  const repo = useMemo(
    () => repository ?? createWritingRepository(),
    [repository]
  )

  return useQuery<WritingDetail>({
    queryKey: writingQueryKeys.detail(writingId),
    queryFn: () => repo.getWriting(writingId),
  })
}

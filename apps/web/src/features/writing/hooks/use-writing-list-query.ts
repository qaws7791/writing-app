"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { WritingSummary } from "@/domain/writing"
import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"
import {
  createWritingRepository,
  type WritingRepository,
} from "@/features/writing/repositories/writing-repository"

export function useWritingListQuery(repository?: WritingRepository) {
  const repo = useMemo(
    () => repository ?? createWritingRepository(),
    [repository]
  )

  return useQuery<WritingSummary[]>({
    queryKey: writingQueryKeys.list(),
    queryFn: () => repo.listWritings(),
  })
}

"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { PromptDetail } from "@/domain/prompt"
import {
  createWritingRepository,
  type WritingRepository,
} from "@/features/writing/repositories/writing-repository"
import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"

export function useWritingPromptQuery(
  writingId: number,
  sourcePromptId: number | null,
  repository?: WritingRepository
) {
  const repo = useMemo(
    () => repository ?? createWritingRepository(),
    [repository]
  )

  return useQuery<PromptDetail>({
    queryKey: writingQueryKeys.prompt(writingId),
    queryFn: () => repo.getPrompt(sourcePromptId!),
    enabled: sourcePromptId !== null,
  })
}

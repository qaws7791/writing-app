"use client"

import { useQuery } from "@tanstack/react-query"

import type { PromptDetail } from "@/domain/prompt"
import { writingQueryKeys } from "@/features/writing/hooks/writing-query-keys"
import { useWritingRepository } from "@/features/writing/hooks/use-writing-repository"
import type { WritingRepository } from "@/features/writing/repositories/writing-repository"

export function useWritingPromptQuery(
  writingId: number,
  sourcePromptId: number | null,
  repository?: WritingRepository
) {
  const repo = useWritingRepository(repository)

  return useQuery<PromptDetail>({
    queryKey: writingQueryKeys.prompt(writingId),
    queryFn: () => repo.getPrompt(sourcePromptId!),
    enabled: sourcePromptId !== null,
  })
}

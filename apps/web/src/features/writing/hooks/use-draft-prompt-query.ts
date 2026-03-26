"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { PromptDetail } from "@/domain/prompt"
import {
  createDraftRepository,
  type DraftRepository,
} from "@/features/writing/repositories/draft-repository"
import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"

export function useDraftPromptQuery(
  draftId: number,
  sourcePromptId: number | null,
  repository?: DraftRepository
) {
  const repo = useMemo(
    () => repository ?? createDraftRepository(),
    [repository]
  )

  return useQuery<PromptDetail>({
    queryKey: draftQueryKeys.prompt(draftId),
    queryFn: () => repo.getPrompt(sourcePromptId!),
    enabled: sourcePromptId !== null,
  })
}

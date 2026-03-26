"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { DraftDetail } from "@/domain/draft"
import {
  createDraftRepository,
  type DraftRepository,
} from "@/features/writing/repositories/draft-repository"
import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"

export function useDraftDetailQuery(
  draftId: number,
  repository?: DraftRepository
) {
  const repo = useMemo(
    () => repository ?? createDraftRepository(),
    [repository]
  )

  return useQuery<DraftDetail>({
    queryKey: draftQueryKeys.detail(draftId),
    queryFn: () => repo.getDraft(draftId),
  })
}

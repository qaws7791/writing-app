"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { DraftSummary } from "@/domain/draft"
import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"
import {
  createDraftRepository,
  type DraftRepository,
} from "@/features/writing/repositories/draft-repository"

export function useDraftListQuery(repository?: DraftRepository) {
  const repo = useMemo(
    () => repository ?? createDraftRepository(),
    [repository]
  )

  return useQuery<DraftSummary[]>({
    queryKey: draftQueryKeys.list(),
    queryFn: () => repo.listDrafts(),
  })
}

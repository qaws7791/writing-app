"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import { draftQueryKeys } from "@/features/writing/hooks/draft-query-keys"
import {
  createDraftListDataSource,
  type DraftListDataSource,
} from "@/features/writing/repositories/draft-list-data-source"
import type { CreateDraftInput } from "@/features/writing/repositories/app-repository"

export function useCreateDraftMutation(dataSource?: DraftListDataSource) {
  const source = useMemo(
    () => dataSource ?? createDraftListDataSource(),
    [dataSource]
  )
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDraftInput) => source.createDraft(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: draftQueryKeys.list() })
    },
  })
}

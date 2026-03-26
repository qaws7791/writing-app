"use client"

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query"
import { useMemo } from "react"
import type { PromptDetail, PromptSummary } from "@/domain/prompt"
import { promptQueryKeys } from "@/features/prompt/hooks/prompt-query-keys"
import {
  createPromptRepository,
  type PromptRepository,
} from "@/features/prompt/repositories/prompt-repository"

type ToggleSaveInput = {
  promptId: number
  /** 현재 저장 상태. true면 저장 해제, false면 저장한다. */
  saved: boolean
}

type MutationContext = {
  previousDetail: PromptDetail | undefined
  previousLists: [QueryKey, PromptSummary[] | undefined][]
}

/**
 * 글감 저장/해제 유스케이스 훅.
 * 낙관적 업데이트로 상세·목록 캐시를 즉시 갱신하고,
 * 실패 시 이전 상태로 롤백한다.
 *
 * @param repository - 의존성 주입용. 생략하면 기본 원격 리포지토리를 사용한다.
 */
export function useTogglePromptSaveMutation(repository?: PromptRepository) {
  const repo = useMemo(
    () => repository ?? createPromptRepository(),
    [repository]
  )
  const queryClient = useQueryClient()

  return useMutation<void, Error, ToggleSaveInput, MutationContext>({
    mutationFn: async ({ promptId, saved }) => {
      if (saved) {
        await repo.unsavePrompt(promptId)
      } else {
        await repo.savePrompt(promptId)
      }
    },

    onMutate: async ({ promptId, saved }) => {
      await queryClient.cancelQueries({
        queryKey: promptQueryKeys.detail(promptId),
      })
      await queryClient.cancelQueries({ queryKey: promptQueryKeys.lists() })

      const previousDetail = queryClient.getQueryData<PromptDetail>(
        promptQueryKeys.detail(promptId)
      )
      const previousLists = queryClient.getQueriesData<PromptSummary[]>({
        queryKey: promptQueryKeys.lists(),
      })

      queryClient.setQueryData<PromptDetail>(
        promptQueryKeys.detail(promptId),
        (old) => (old ? { ...old, saved: !saved } : old)
      )

      for (const [queryKey] of previousLists) {
        queryClient.setQueryData<PromptSummary[]>(queryKey, (old) =>
          old?.map((p) => (p.id === promptId ? { ...p, saved: !saved } : p))
        )
      }

      return { previousDetail, previousLists }
    },

    onError: (_error, { promptId }, context) => {
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(
          promptQueryKeys.detail(promptId),
          context.previousDetail
        )
      }
      for (const [queryKey, data] of context?.previousLists ?? []) {
        queryClient.setQueryData(queryKey, data)
      }
    },

    onSettled: (_data, _error, { promptId }) => {
      void queryClient.invalidateQueries({
        queryKey: promptQueryKeys.detail(promptId),
      })
      void queryClient.invalidateQueries({ queryKey: promptQueryKeys.lists() })
    },
  })
}

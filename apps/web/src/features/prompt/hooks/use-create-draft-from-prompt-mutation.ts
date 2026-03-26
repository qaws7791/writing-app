"use client"

import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  createPromptDataSource,
  type PromptDataSource,
} from "@/features/prompt/repositories/prompt-data-source"

/**
 * 글감으로 새 초안을 만드는 유스케이스 훅.
 *
 * @param dataSource - 의존성 주입용. 생략하면 기본 원격 데이터 소스를 사용한다.
 */
export function useCreateDraftFromPromptMutation(
  dataSource?: PromptDataSource
) {
  const source = useMemo(
    () => dataSource ?? createPromptDataSource(),
    [dataSource]
  )

  return useMutation({
    mutationFn: (promptId: number) =>
      source.createDraft({ sourcePromptId: promptId }),
  })
}

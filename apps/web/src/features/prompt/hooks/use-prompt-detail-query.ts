"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { promptQueryKeys } from "@/features/prompt/hooks/prompt-query-keys"
import {
  createPromptDataSource,
  type PromptDataSource,
} from "@/features/prompt/repositories/prompt-data-source"

/**
 * 글감 상세 정보를 가져오는 유스케이스 훅.
 * TanStack Query로 캐싱·로딩·에러 상태를 자동 관리한다.
 *
 * @param dataSource - 의존성 주입용. 생략하면 기본 원격 데이터 소스를 사용한다.
 */
export function usePromptDetailQuery(
  promptId: number,
  dataSource?: PromptDataSource
) {
  const source = useMemo(
    () => dataSource ?? createPromptDataSource(),
    [dataSource]
  )

  return useQuery({
    queryKey: promptQueryKeys.detail(promptId),
    queryFn: () => source.getPrompt(promptId),
  })
}

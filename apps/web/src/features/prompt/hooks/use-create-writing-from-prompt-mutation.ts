"use client"

import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  createPromptRepository,
  type PromptRepository,
} from "@/features/prompt/repositories/prompt-repository"

/**
 * 글감으로 새 글을 만드는 유스케이스 훅.
 *
 * @param repository - 의존성 주입용. 생략하면 기본 원격 리포지토리를 사용한다.
 */
export function useCreateWritingFromPromptMutation(
  repository?: PromptRepository
) {
  const repo = useMemo(
    () => repository ?? createPromptRepository(),
    [repository]
  )

  return useMutation({
    mutationFn: (promptId: number) =>
      repo.createWriting({ sourcePromptId: promptId }),
  })
}

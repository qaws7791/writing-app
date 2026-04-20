import { useQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { fetchPromptDetail } from "../repositories/prompt.repository"

export function usePromptDetail(promptId: number | undefined) {
  const apiClient = useApiClient()
  const validPromptId = promptId !== undefined && promptId > 0 ? promptId : null

  return useQuery({
    queryKey: ["prompts", "detail", promptId],
    queryFn: () => {
      if (validPromptId === null) {
        throw new Error("유효한 글감 ID가 필요합니다.")
      }

      return fetchPromptDetail(apiClient, validPromptId)
    },
    enabled: validPromptId !== null,
    staleTime: 60_000,
  })
}

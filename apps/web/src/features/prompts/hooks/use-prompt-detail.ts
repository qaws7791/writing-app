import { useQuery } from "@tanstack/react-query"

import {
  createDetailQueryKey,
  getPositiveId,
  requirePositiveId,
  useApiClient,
} from "@/foundation/api"

import { fetchPromptDetail } from "../repositories/prompt.repository"

export function usePromptDetail(promptId: number | undefined) {
  const apiClient = useApiClient()
  const validPromptId = getPositiveId(promptId)

  return useQuery({
    queryKey: createDetailQueryKey("prompts", promptId),
    queryFn: () => {
      return fetchPromptDetail(
        apiClient,
        requirePositiveId(validPromptId, "유효한 글감 ID가 필요합니다.")
      )
    },
    enabled: validPromptId !== null,
  })
}

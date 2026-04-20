import { useQuery } from "@tanstack/react-query"

import {
  getPositiveId,
  requirePositiveId,
  useApiClient,
} from "@/foundation/api"

import { promptQueryKeys } from "../query-keys"
import { fetchPromptDetail } from "../repositories/prompt.repository"

export function usePromptDetail(promptId: number | undefined) {
  const apiClient = useApiClient()
  const validPromptId = getPositiveId(promptId)

  return useQuery({
    queryKey: promptQueryKeys.detail(promptId),
    queryFn: () => {
      return fetchPromptDetail(
        apiClient,
        requirePositiveId(validPromptId, "유효한 글감 ID가 필요합니다.")
      )
    },
    enabled: validPromptId !== null,
  })
}

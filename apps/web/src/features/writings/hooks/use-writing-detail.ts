import { useQuery } from "@tanstack/react-query"

import {
  getPositiveId,
  requirePositiveId,
  useApiClient,
} from "@/foundation/api"

import { writingQueryKeys } from "../query-keys"
import { fetchWritingDetail } from "../repositories/writing.repository"

export function useWritingDetail(writingId: number | undefined) {
  const apiClient = useApiClient()
  const validWritingId = getPositiveId(writingId)

  return useQuery({
    queryKey: writingQueryKeys.detail(writingId),
    queryFn: () => {
      return fetchWritingDetail(
        apiClient,
        requirePositiveId(validWritingId, "유효한 글 ID가 필요합니다.")
      )
    },
    enabled: validWritingId !== null,
    staleTime: 30_000,
  })
}

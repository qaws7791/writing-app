import { useQuery } from "@tanstack/react-query"

import {
  createDetailQueryKey,
  getPositiveId,
  requirePositiveId,
  useApiClient,
} from "@/foundation/api"

import { fetchJourneyDetail } from "../repositories/journey.repository"

export function useJourneyDetail(journeyId: number | undefined) {
  const apiClient = useApiClient()
  const validJourneyId = getPositiveId(journeyId)

  return useQuery({
    queryKey: createDetailQueryKey("journeys", journeyId),
    queryFn: () => {
      return fetchJourneyDetail(
        apiClient,
        requirePositiveId(validJourneyId, "유효한 여정 ID가 필요합니다.")
      )
    },
    enabled: validJourneyId !== null,
  })
}

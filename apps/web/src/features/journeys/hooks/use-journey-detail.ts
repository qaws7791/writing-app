import { useQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { fetchJourneyDetail } from "../repositories/journey.repository"

export function useJourneyDetail(journeyId: number | undefined) {
  const apiClient = useApiClient()
  const validJourneyId =
    journeyId !== undefined && journeyId > 0 ? journeyId : null

  return useQuery({
    queryKey: ["journeys", "detail", journeyId],
    queryFn: () => {
      if (validJourneyId === null) {
        throw new Error("유효한 여정 ID가 필요합니다.")
      }

      return fetchJourneyDetail(apiClient, validJourneyId)
    },
    enabled: validJourneyId !== null,
    staleTime: 60_000,
  })
}

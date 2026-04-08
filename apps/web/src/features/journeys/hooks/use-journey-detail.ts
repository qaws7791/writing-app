import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchJourneyDetail } from "../repositories/journey.repository"

export function useJourneyDetail(journeyId: number | undefined) {
  return useQuery({
    queryKey: ["journeys", "detail", journeyId],
    queryFn: () => fetchJourneyDetail(apiClient, journeyId!),
    enabled: journeyId != null && journeyId > 0,
    staleTime: 60_000,
  })
}

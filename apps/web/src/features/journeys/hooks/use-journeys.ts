import { useQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { journeyQueryKeys } from "../query-keys"
import { fetchJourneyList } from "../repositories/journey.repository"

export function useJourneys(params?: {
  category?: "writing_skill" | "mindfulness" | "practical"
  status?: "all" | "in_progress" | "completed"
}) {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: journeyQueryKeys.list(params),
    queryFn: () => fetchJourneyList(apiClient, params),
    staleTime: 60_000,
  })
}

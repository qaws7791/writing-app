import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchJourneyList } from "../repositories/journey.repository"

export function useJourneys(params?: {
  category?: "writing_skill" | "mindfulness" | "practical"
  status?: "all" | "in_progress" | "completed"
}) {
  return useQuery({
    queryKey: ["journeys", "list", params],
    queryFn: () => fetchJourneyList(apiClient, params),
    staleTime: 60_000,
  })
}

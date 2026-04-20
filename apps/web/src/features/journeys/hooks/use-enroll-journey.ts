import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { enrollJourney } from "../repositories/journey.repository"

export function useEnrollJourney() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (journeyId: number) => enrollJourney(apiClient, journeyId),
    onSuccess: (_, journeyId) => {
      void queryClient.invalidateQueries({ queryKey: ["home", "snapshot"] })
      void queryClient.invalidateQueries({
        queryKey: ["journeys", "detail", journeyId],
      })
    },
  })
}

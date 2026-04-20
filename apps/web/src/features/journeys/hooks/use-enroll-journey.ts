import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"
import { homeQueryKeys } from "@/features/home/query-keys"

import { journeyQueryKeys } from "../query-keys"
import { enrollJourney } from "../repositories/journey.repository"

export function useEnrollJourney() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (journeyId: number) => enrollJourney(apiClient, journeyId),
    onSuccess: (_, journeyId) => {
      void queryClient.invalidateQueries({ queryKey: homeQueryKeys.snapshot() })
      void queryClient.invalidateQueries({
        queryKey: journeyQueryKeys.detail(journeyId),
      })
    },
  })
}

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"
import { homeQueryKeys } from "@/features/home/query-keys"
import { journeyQueryKeys } from "@/features/journeys/query-keys"

import { completeSession } from "../repositories/session.repository"

export function useCompleteSession() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      sessionId: number
      journeyId: number
      nextSessionOrder: number
      totalSessions: number
    }) => completeSession(apiClient, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeQueryKeys.snapshot() })
      void queryClient.invalidateQueries({ queryKey: journeyQueryKeys.all() })
    },
  })
}

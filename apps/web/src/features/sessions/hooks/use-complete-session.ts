import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { completeSession } from "../repositories/session.repository"

export function useCompleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      sessionId: number
      journeyId: number
      nextSessionOrder: number
      totalSessions: number
    }) => completeSession(apiClient, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["home", "snapshot"] })
      void queryClient.invalidateQueries({ queryKey: ["journeys"] })
    },
  })
}

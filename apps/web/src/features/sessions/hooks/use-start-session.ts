import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"
import { homeQueryKeys } from "@/features/home/query-keys"

import { sessionQueryKeys } from "../query-keys"
import { startSession } from "../repositories/session.repository"

export function useStartSession() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: number) => startSession(apiClient, sessionId),
    onSuccess: (data, sessionId) => {
      void queryClient.invalidateQueries({ queryKey: homeQueryKeys.snapshot() })
      queryClient.setQueryData(sessionQueryKeys.detail(sessionId), data)
    },
  })
}

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { startSession } from "../repositories/session.repository"

export function useStartSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: number) => startSession(apiClient, sessionId),
    onSuccess: (data, sessionId) => {
      void queryClient.invalidateQueries({ queryKey: ["home", "snapshot"] })
      queryClient.setQueryData(["sessions", "detail", sessionId], data)
    },
  })
}

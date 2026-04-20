import { useMutation, useQueryClient } from "@tanstack/react-query"

import { setDetailQueryData, useApiClient } from "@/foundation/api"

import { retrySessionStepAi } from "../repositories/session.repository"

export function useRetrySessionStepAi() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { sessionId: number; stepOrder: number }) =>
      retrySessionStepAi(apiClient, input),
    onSuccess: (data, input) => {
      setDetailQueryData(queryClient, "sessions", input.sessionId, data)
    },
  })
}

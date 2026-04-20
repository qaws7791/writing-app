import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { retrySessionStepAi } from "../repositories/session.repository"

export function useRetrySessionStepAi() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { sessionId: number; stepOrder: number }) =>
      retrySessionStepAi(apiClient, input),
    onSuccess: (data, input) => {
      queryClient.setQueryData(["sessions", "detail", input.sessionId], data)
    },
  })
}

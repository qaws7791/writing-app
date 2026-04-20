import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import type { SessionStepResponse } from "../session-step-response"
import { submitSessionStep } from "../repositories/session.repository"

export function useSubmitSessionStep() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      sessionId: number
      stepOrder: number
      response?: SessionStepResponse
    }) => submitSessionStep(apiClient, input),
    onSuccess: (data, input) => {
      queryClient.setQueryData(["sessions", "detail", input.sessionId], data)
    },
  })
}

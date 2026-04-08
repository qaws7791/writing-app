import { useMutation } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { submitSessionStep } from "../repositories/session.repository"

export function useSubmitSessionStep() {
  return useMutation({
    mutationFn: (input: {
      sessionId: number
      stepOrder: number
      response?: unknown
    }) => submitSessionStep(apiClient, input),
  })
}

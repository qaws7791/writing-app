import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { writingQueryKeys } from "../query-keys"
import { createWriting } from "../repositories/writing.repository"

export function useCreateWriting() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      title?: string
      bodyJson?: unknown
      bodyPlainText?: string
      wordCount?: number
      sourcePromptId?: number
    }) => createWriting(apiClient, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: writingQueryKeys.list() })
    },
  })
}

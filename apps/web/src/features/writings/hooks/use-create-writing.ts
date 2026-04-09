import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { createWriting } from "../repositories/writing.repository"

export function useCreateWriting() {
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
      void queryClient.invalidateQueries({ queryKey: ["writings", "list"] })
    },
  })
}

import { useMutation } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { createWriting } from "../repositories/writing.repository"

export function useCreateWriting() {
  return useMutation({
    mutationFn: (input: {
      title?: string
      bodyJson?: unknown
      bodyPlainText?: string
      wordCount?: number
      sourcePromptId?: number
    }) => createWriting(apiClient, input),
  })
}

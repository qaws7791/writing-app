import { useMutation } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { compareTexts } from "../repositories/ai.repository"

export function useCompareTexts() {
  return useMutation({
    mutationFn: ({
      originalText,
      revisedText,
    }: {
      originalText: string
      revisedText: string
    }) => compareTexts(apiClient, { originalText, revisedText }),
  })
}

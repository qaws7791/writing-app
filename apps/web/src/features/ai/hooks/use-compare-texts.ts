import { useMutation } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { compareTexts } from "../repositories/ai.repository"

export function useCompareTexts() {
  const apiClient = useApiClient()

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

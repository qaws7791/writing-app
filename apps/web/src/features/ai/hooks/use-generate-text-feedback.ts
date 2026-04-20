import { useMutation } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { generateTextFeedback } from "../repositories/ai.repository"

export function useGenerateTextFeedback() {
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: ({
      text,
      level,
    }: {
      text: string
      level?: "beginner" | "intermediate" | "advanced"
    }) => generateTextFeedback(apiClient, { text, level }),
  })
}

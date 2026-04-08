import { useMutation } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { generateTextFeedback } from "../repositories/ai.repository"

export function useGenerateTextFeedback() {
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

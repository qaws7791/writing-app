import { useMutation } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { generateWritingFeedback } from "../repositories/writing.repository"

export function useGenerateWritingFeedback() {
  return useMutation({
    mutationFn: ({
      writingId,
      level,
    }: {
      writingId: number
      level?: "beginner" | "intermediate" | "advanced"
    }) => generateWritingFeedback(apiClient, writingId, { level }),
  })
}

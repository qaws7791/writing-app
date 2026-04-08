import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { generateTextFeedback } from "../repositories/ai.repository"

export function useAIFeedback(text: string) {
  return useQuery({
    queryKey: ["ai-feedback", text],
    queryFn: () => generateTextFeedback(apiClient, { text }),
    enabled: !!text,
    staleTime: Infinity,
    retry: 1,
  })
}

import { useQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { generateTextFeedback } from "../repositories/ai.repository"

export function useAIFeedback(text: string) {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: ["ai-feedback", text],
    queryFn: () => generateTextFeedback(apiClient, { text }),
    enabled: !!text,
    staleTime: Infinity,
    retry: 1,
  })
}

import { useQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { aiQueryKeys } from "../query-keys"
import { generateTextFeedback } from "../repositories/ai.repository"

export function useAIFeedback(text: string) {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: aiQueryKeys.feedback(text),
    queryFn: () => generateTextFeedback(apiClient, { text }),
    enabled: !!text,
    staleTime: Infinity,
    retry: 1,
  })
}

import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchPromptDetail } from "../repositories/prompt.repository"

export function usePromptDetail(promptId: number | undefined) {
  return useQuery({
    queryKey: ["prompts", "detail", promptId],
    queryFn: () => fetchPromptDetail(apiClient, promptId!),
    enabled: promptId != null && promptId > 0,
    staleTime: 60_000,
  })
}

import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchPromptCategories } from "../repositories/prompt.repository"

export function usePromptCategories() {
  return useQuery({
    queryKey: ["prompts", "categories"],
    queryFn: () => fetchPromptCategories(apiClient),
    staleTime: 5 * 60_000,
  })
}

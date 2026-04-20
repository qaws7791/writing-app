import { useQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { promptQueryKeys } from "../query-keys"
import { fetchPromptCategories } from "../repositories/prompt.repository"

export function usePromptCategories() {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: promptQueryKeys.categories(),
    queryFn: () => fetchPromptCategories(apiClient),
    staleTime: 5 * 60_000,
  })
}

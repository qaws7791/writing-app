import { useInfiniteQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { promptQueryKeys } from "../query-keys"
import { fetchPromptList } from "../repositories/prompt.repository"

type PromptType = "sensory" | "reflection" | "opinion"

export function usePromptList(params?: {
  promptType?: PromptType
  limit?: number
}) {
  const apiClient = useApiClient()

  return useInfiniteQuery({
    queryKey: promptQueryKeys.list(params),
    queryFn: ({ pageParam }) =>
      fetchPromptList(apiClient, {
        promptType: params?.promptType,
        limit: params?.limit ?? 20,
        cursor: pageParam,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

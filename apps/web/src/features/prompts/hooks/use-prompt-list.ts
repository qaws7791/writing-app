import { useInfiniteQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchPromptList } from "../repositories/prompt.repository"

type PromptType = "sensory" | "reflection" | "opinion"

export function usePromptList(params?: {
  promptType?: PromptType
  limit?: number
}) {
  return useInfiniteQuery({
    queryKey: ["prompts", "list", params],
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

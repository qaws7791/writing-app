import { useInfiniteQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { promptQueryKeys } from "../query-keys"
import { fetchPromptWritings } from "../repositories/prompt.repository"

type PromptWritingPage = Awaited<ReturnType<typeof fetchPromptWritings>>
type PromptWritingItem = PromptWritingPage["items"][number]

export function usePromptWritings(promptId: number, limit = 20) {
  const apiClient = useApiClient()
  const query = useInfiniteQuery({
    queryKey: promptQueryKeys.writings(promptId),
    queryFn: ({ pageParam }): Promise<PromptWritingPage> =>
      fetchPromptWritings(apiClient, promptId, {
        cursor: pageParam,
        limit,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

  return {
    ...query,
    writings: (query.data?.pages.flatMap((page) => page.items) ??
      []) as PromptWritingItem[],
  }
}

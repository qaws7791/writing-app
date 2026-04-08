import { useInfiniteQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchPromptWritings } from "../repositories/prompt.repository"

type PromptWritingPage = Awaited<ReturnType<typeof fetchPromptWritings>>
type PromptWritingItem = PromptWritingPage["items"][number]

export function usePromptWritings(promptId: number, limit = 20) {
  const query = useInfiniteQuery({
    queryKey: ["prompts", "writings", promptId],
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

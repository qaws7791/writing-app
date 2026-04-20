import { useInfiniteQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { writingQueryKeys } from "../query-keys"
import { fetchWritings } from "../repositories/writing.repository"

export function useWritings() {
  const apiClient = useApiClient()

  return useInfiniteQuery({
    queryKey: writingQueryKeys.list(),
    queryFn: ({ pageParam }) =>
      fetchWritings(apiClient, { cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  })
}

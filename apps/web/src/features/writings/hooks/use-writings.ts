import { useInfiniteQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { fetchWritings } from "../repositories/writing.repository"

export function useWritings() {
  const apiClient = useApiClient()

  return useInfiniteQuery({
    queryKey: ["writings", "list"],
    queryFn: ({ pageParam }) =>
      fetchWritings(apiClient, { cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  })
}

import { useInfiniteQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchWritings } from "../repositories/writing.repository"

export function useWritings() {
  return useInfiniteQuery({
    queryKey: ["writings", "list"],
    queryFn: ({ pageParam }) =>
      fetchWritings(apiClient, { cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  })
}

import { useQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { homeQueryKeys } from "../query-keys"
import { fetchHomeSnapshot } from "../repositories/home.repository"

export function useHomeSnapshot() {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: homeQueryKeys.snapshot(),
    queryFn: () => fetchHomeSnapshot(apiClient),
    staleTime: 60_000,
  })
}

import { useQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { fetchHomeSnapshot } from "../repositories/home.repository"

export function useHomeSnapshot() {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: ["home", "snapshot"],
    queryFn: () => fetchHomeSnapshot(apiClient),
    staleTime: 60_000,
  })
}

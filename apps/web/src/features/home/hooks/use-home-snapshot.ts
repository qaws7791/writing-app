import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchHomeSnapshot } from "../repositories/home.repository"

export function useHomeSnapshot() {
  return useQuery({
    queryKey: ["home", "snapshot"],
    queryFn: () => fetchHomeSnapshot(apiClient),
    staleTime: 60_000,
  })
}

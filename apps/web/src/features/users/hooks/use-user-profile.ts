import { useQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { fetchUserProfile } from "../repositories/user.repository"

export function useUserProfile() {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: ["users", "profile"],
    queryFn: () => fetchUserProfile(apiClient),
    staleTime: 60_000,
  })
}

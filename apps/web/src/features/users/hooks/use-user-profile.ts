import { useQuery } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { userQueryKeys } from "../query-keys"
import { fetchUserProfile } from "../repositories/user.repository"

export function useUserProfile() {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: userQueryKeys.profile(),
    queryFn: () => fetchUserProfile(apiClient),
    staleTime: 60_000,
  })
}

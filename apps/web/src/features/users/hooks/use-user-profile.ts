import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchUserProfile } from "../repositories/user.repository"

export function useUserProfile() {
  return useQuery({
    queryKey: ["users", "profile"],
    queryFn: () => fetchUserProfile(apiClient),
    staleTime: 60_000,
  })
}

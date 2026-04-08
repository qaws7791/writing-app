import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchSessionDetail } from "../repositories/session.repository"

export function useSessionDetail(sessionId: number | undefined) {
  return useQuery({
    queryKey: ["sessions", "detail", sessionId],
    queryFn: () => fetchSessionDetail(apiClient, sessionId!),
    enabled: sessionId != null && sessionId > 0,
    staleTime: 60_000,
  })
}

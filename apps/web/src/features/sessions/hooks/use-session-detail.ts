import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchSessionDetail } from "../repositories/session.repository"

function hasPendingSessionAi(
  session: Awaited<ReturnType<typeof fetchSessionDetail>> | undefined
): boolean {
  return (
    session?.stepAiStates.some((state) => state.status === "pending") ?? false
  )
}

export function useSessionDetail(sessionId: number | undefined) {
  return useQuery({
    queryKey: ["sessions", "detail", sessionId],
    queryFn: () => fetchSessionDetail(apiClient, sessionId!),
    enabled: sessionId != null && sessionId > 0,
    refetchInterval: (query) =>
      hasPendingSessionAi(query.state.data) ? 1_000 : false,
    staleTime: 60_000,
  })
}

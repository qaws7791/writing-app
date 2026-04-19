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
  const validSessionId =
    sessionId !== undefined && sessionId > 0 ? sessionId : null

  return useQuery({
    queryKey: ["sessions", "detail", sessionId],
    queryFn: () => {
      if (validSessionId === null) {
        throw new Error("유효한 세션 ID가 필요합니다.")
      }

      return fetchSessionDetail(apiClient, validSessionId)
    },
    enabled: validSessionId !== null,
    refetchInterval: (query) =>
      hasPendingSessionAi(query.state.data) ? 1_000 : false,
    staleTime: 60_000,
  })
}

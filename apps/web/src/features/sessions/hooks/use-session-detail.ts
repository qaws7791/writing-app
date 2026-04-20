import { useQuery } from "@tanstack/react-query"

import {
  createDetailQueryKey,
  getPositiveId,
  requirePositiveId,
  useApiClient,
} from "@/foundation/api"

import { fetchSessionDetail } from "../repositories/session.repository"

function hasPendingSessionAi(
  session: Awaited<ReturnType<typeof fetchSessionDetail>> | undefined
): boolean {
  return (
    session?.stepAiStates.some((state) => state.status === "pending") ?? false
  )
}

export function useSessionDetail(sessionId: number | undefined) {
  const apiClient = useApiClient()
  const validSessionId = getPositiveId(sessionId)

  return useQuery({
    queryKey: createDetailQueryKey("sessions", sessionId),
    queryFn: () => {
      return fetchSessionDetail(
        apiClient,
        requirePositiveId(validSessionId, "유효한 세션 ID가 필요합니다.")
      )
    },
    enabled: validSessionId !== null,
    refetchInterval: (query) =>
      hasPendingSessionAi(query.state.data) ? 1_000 : false,
  })
}

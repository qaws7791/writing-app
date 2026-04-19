import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchWritingDetail } from "../repositories/writing.repository"

export function useWritingDetail(writingId: number | undefined) {
  const validWritingId =
    writingId !== undefined && writingId > 0 ? writingId : null

  return useQuery({
    queryKey: ["writings", "detail", writingId],
    queryFn: () => {
      if (validWritingId === null) {
        throw new Error("유효한 글 ID가 필요합니다.")
      }

      return fetchWritingDetail(apiClient, validWritingId)
    },
    enabled: validWritingId !== null,
    staleTime: 30_000,
  })
}

import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { fetchWritingDetail } from "../repositories/writing.repository"

export function useWritingDetail(writingId: number | undefined) {
  return useQuery({
    queryKey: ["writings", "detail", writingId],
    queryFn: () => fetchWritingDetail(apiClient, writingId!),
    enabled: writingId != null && writingId > 0,
    staleTime: 30_000,
  })
}

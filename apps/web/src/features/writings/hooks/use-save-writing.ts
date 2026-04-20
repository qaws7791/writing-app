import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { writingQueryKeys } from "../query-keys"
import { saveWriting } from "../repositories/writing.repository"

export function useSaveWriting() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      writingId,
      ...input
    }: {
      writingId: number
      title?: string
      bodyJson?: unknown
      bodyPlainText?: string
      wordCount?: number
    }) => saveWriting(apiClient, writingId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: writingQueryKeys.list() })
    },
  })
}

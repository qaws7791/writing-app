import { useMutation } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { compareWritingRevision } from "../repositories/writing.repository"

export function useCompareWritingRevision() {
  return useMutation({
    mutationFn: ({
      writingId,
      originalText,
      revisedText,
    }: {
      writingId: number
      originalText: string
      revisedText: string
    }) =>
      compareWritingRevision(apiClient, writingId, {
        originalText,
        revisedText,
      }),
  })
}

import { useMutation } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { saveWriting } from "../repositories/writing.repository"

export function useSaveWriting() {
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
  })
}

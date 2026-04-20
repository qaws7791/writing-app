import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApiClient } from "@/foundation/api"

import { deleteWriting } from "../repositories/writing.repository"

export function useDeleteWriting() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (writingId: number) => deleteWriting(apiClient, writingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["writings", "list"] })
    },
  })
}

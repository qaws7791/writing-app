import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/foundation/api/client"

import { deleteWriting } from "../repositories/writing.repository"

export function useDeleteWriting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (writingId: number) => deleteWriting(apiClient, writingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["writings", "list"] })
    },
  })
}

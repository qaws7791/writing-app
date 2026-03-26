import type { PromptFilters } from "@/domain/prompt"

export const promptQueryKeys = {
  all: ["prompts"] as const,
  detail: (promptId: number) =>
    [...promptQueryKeys.all, "detail", promptId] as const,
  lists: () => [...promptQueryKeys.all, "list"] as const,
  list: (filters?: PromptFilters) =>
    [...promptQueryKeys.lists(), filters] as const,
}

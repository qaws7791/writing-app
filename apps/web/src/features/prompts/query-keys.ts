type PromptType = "sensory" | "reflection" | "opinion"

export const promptQueryKeys = {
  categories: () => ["prompts", "categories"] as const,
  detail: (promptId: number | undefined) =>
    ["prompts", "detail", promptId] as const,
  list: (params?: { promptType?: PromptType; limit?: number }) =>
    ["prompts", "list", params] as const,
  writings: (promptId: number) => ["prompts", "writings", promptId] as const,
} as const

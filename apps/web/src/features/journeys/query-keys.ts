export const journeyQueryKeys = {
  all: () => ["journeys"] as const,
  detail: (journeyId: number | undefined) =>
    ["journeys", "detail", journeyId] as const,
  list: (params?: {
    category?: "writing_skill" | "mindfulness" | "practical"
    status?: "all" | "in_progress" | "completed"
  }) => ["journeys", "list", params] as const,
} as const

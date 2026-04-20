export const writingQueryKeys = {
  detail: (writingId: number | undefined) =>
    ["writings", "detail", writingId] as const,
  list: () => ["writings", "list"] as const,
} as const

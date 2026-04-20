export const sessionQueryKeys = {
  detail: (sessionId: number | undefined) =>
    ["sessions", "detail", sessionId] as const,
} as const

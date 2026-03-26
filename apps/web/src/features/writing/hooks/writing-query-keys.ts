export const writingQueryKeys = {
  all: ["writings"] as const,
  detail: (writingId: number) =>
    [...writingQueryKeys.all, "detail", writingId] as const,
  list: () => [...writingQueryKeys.all, "list"] as const,
  prompt: (writingId: number) =>
    [...writingQueryKeys.all, "prompt", writingId] as const,
}

export const versionQueryKeys = {
  all: (writingId: number) => ["versions", writingId] as const,
  detail: (writingId: number, version: number) =>
    [...versionQueryKeys.all(writingId), "detail", version] as const,
  list: (writingId: number) =>
    [...versionQueryKeys.all(writingId), "list"] as const,
}

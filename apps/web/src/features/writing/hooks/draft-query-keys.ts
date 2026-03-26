export const draftQueryKeys = {
  all: ["drafts"] as const,
  detail: (draftId: number) =>
    [...draftQueryKeys.all, "detail", draftId] as const,
  prompt: (draftId: number) =>
    [...draftQueryKeys.all, "prompt", draftId] as const,
}

export const versionQueryKeys = {
  all: (draftId: number) => ["versions", draftId] as const,
  detail: (draftId: number, version: number) =>
    [...versionQueryKeys.all(draftId), "detail", version] as const,
  list: (draftId: number) =>
    [...versionQueryKeys.all(draftId), "list"] as const,
}

export type LearnerTestAuthDisplayNameSynchronizer = {
  readonly synchronizeDisplayName: (input: {
    readonly displayName: string
    readonly updatedAt: Date
    readonly userId: string
  }) => Promise<void> | void
}

export type LearnerTestAuthConfiguration =
  | { readonly kind: "disabled" }
  | ({ readonly kind: "enabled" } & LearnerTestAuthDisplayNameSynchronizer)

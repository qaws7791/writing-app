type AliasedDecision = Readonly<{ kind: "accepted" }> | null

export function validateInferred() {
  return null
}

export function decideAliased(): AliasedDecision {
  return { kind: "accepted" }
}

export const transitionContextual: () => AliasedDecision = () => ({
  kind: "accepted",
})

export function validateExplicit(): Readonly<{ kind: "accepted" }> {
  return { kind: "accepted" }
}

export function readOptional(): null {
  return null
}

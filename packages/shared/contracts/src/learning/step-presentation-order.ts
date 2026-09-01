import { hmacSha256Hex } from "#contracts/learning/hmac-sha256"

export function createLearnerStepPresentationScope(input: {
  readonly learnerScope: string
  readonly lessonId: string
  readonly stepId: string
  readonly versionId: string
}): string {
  return `${input.learnerScope}:${input.versionId}:${input.lessonId}:${input.stepId}`
}

export function createAdminPreviewPresentationScope(stepId: string): string {
  return `admin-preview:${stepId}`
}

export function orderLearnerStepItems<T extends { readonly id: string }>(
  items: readonly T[],
  scope: string
): readonly T[] {
  return Array.from(items).sort((left, right) => {
    const leftKey = hmacSha256Hex(scope, left.id)
    const rightKey = hmacSha256Hex(scope, right.id)
    return leftKey.localeCompare(rightKey) || left.id.localeCompare(right.id)
  })
}

export function rotateLeftIfPrefixMatches<T extends { readonly id: string }>(
  items: readonly T[],
  correctIds: readonly string[]
): readonly T[] {
  if (items.length <= 1 || correctIds.length === 0) {
    return items
  }
  if (correctIds.length > items.length) {
    return items
  }
  const matches = correctIds.every((id, index) => items[index]?.id === id)
  if (!matches) {
    return items
  }
  const first = items[0]
  if (first === undefined) {
    return items
  }
  return [...items.slice(1), first]
}

export function orderLearnerStepItemsAvoidingPrefix<
  T extends { readonly id: string },
>(
  items: readonly T[],
  scope: string,
  correctIds: readonly string[]
): readonly T[] {
  return rotateLeftIfPrefixMatches(
    orderLearnerStepItems(items, scope),
    correctIds
  )
}

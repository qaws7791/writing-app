import {
  createAdminPreviewPresentationScope,
  orderLearnerStepItems,
  orderLearnerStepItemsAvoidingPrefix,
} from "@workspace/contracts/learning/step-presentation-order"

export function orderAdminPreviewItems<T extends { readonly id: string }>(
  items: readonly T[],
  stepId: string,
  correctIds?: readonly string[]
): readonly T[] {
  const scope = createAdminPreviewPresentationScope(stepId)
  return correctIds === undefined
    ? orderLearnerStepItems(items, scope)
    : orderLearnerStepItemsAvoidingPrefix(items, scope, correctIds)
}

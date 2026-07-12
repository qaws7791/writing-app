export const resourceTreeRootId = "resource-library-root"

export type ResourceTreeDropItem = {
  readonly getChildren: () => readonly ResourceTreeDropItem[]
  readonly getId: () => string
  readonly isFolder: () => boolean
}

export type ResourceTreeDropTarget =
  | {
      readonly insertionIndex: number
      readonly item: ResourceTreeDropItem
      readonly kind: "ordered"
    }
  | {
      readonly item: ResourceTreeDropItem
      readonly kind: "parent"
    }

export type ResourceMoveDestination = {
  readonly destinationIndex: number
  readonly destinationParentId: string | null
}

export type ResourceTreeDragPolicyInput = {
  readonly itemCount: number
  readonly itemKind: "document" | "folder" | "loading" | "root" | undefined
  readonly mutationInFlight: boolean
  readonly scope: "active" | "trash"
  readonly structureMutationsAllowed: boolean
}

export type ResourceTreeDropPolicyInput = Omit<
  ResourceTreeDragPolicyInput,
  "mutationInFlight"
> & {
  readonly targetIsFolder: boolean
  readonly targetKind: "ordered" | "parent"
}

export function canDragResourceTreeItem(
  input: ResourceTreeDragPolicyInput
): boolean {
  return (
    input.scope === "active" &&
    input.structureMutationsAllowed &&
    !input.mutationInFlight &&
    input.itemCount === 1 &&
    (input.itemKind === "document" || input.itemKind === "folder")
  )
}

export function canDropResourceTreeItem(
  input: ResourceTreeDropPolicyInput
): boolean {
  return (
    input.scope === "active" &&
    input.structureMutationsAllowed &&
    input.itemCount === 1 &&
    (input.targetKind === "ordered" || input.targetIsFolder)
  )
}

export function readResourceMoveDestination(
  target: ResourceTreeDropTarget
): ResourceMoveDestination | null {
  if (target.kind === "ordered") {
    return {
      destinationIndex: target.insertionIndex,
      destinationParentId: toResourceParentId(target.item.getId()),
    }
  }

  if (!target.item.isFolder()) {
    return null
  }

  return {
    destinationIndex: target.item.getChildren().length,
    destinationParentId: toResourceParentId(target.item.getId()),
  }
}

export function moveResourceIdOptimistically(input: {
  readonly destinationIds: readonly string[]
  readonly destinationIndex: number
  readonly movingId: string
  readonly sourceIds: readonly string[]
  readonly sameParent: boolean
}): {
  readonly destinationIds: readonly string[]
  readonly sourceIds: readonly string[]
} {
  const sourceIds = input.sourceIds.filter((id) => id !== input.movingId)
  const destinationIds = (
    input.sameParent
      ? sourceIds
      : input.destinationIds.filter((id) => id !== input.movingId)
  ).slice()

  destinationIds.splice(input.destinationIndex, 0, input.movingId)

  return {
    destinationIds,
    sourceIds: input.sameParent ? destinationIds : sourceIds,
  }
}

function toResourceParentId(itemId: string): string | null {
  return itemId === resourceTreeRootId ? null : itemId
}

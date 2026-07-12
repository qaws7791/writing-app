import type {
  AdminResourceTree,
  AdminResourceTreeNode,
} from "@/features/resources/resource-library-model"

export type ResourceTreeRootItem = {
  readonly kind: "root"
  readonly name: "자료실"
}

export type ResourceTreeLoadingItem = {
  readonly kind: "loading"
  readonly name: "불러오는 중"
}

export type ResourceTreeItemData =
  | AdminResourceTreeNode
  | ResourceTreeLoadingItem
  | ResourceTreeRootItem

export type InitialResourceTreeState =
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ok"; readonly value: AdminResourceTree }

export type ResourceTreeAction = "move" | "rename" | "restore" | "trash"

export type ResourceTreeMoveInput = {
  readonly destinationIndex: number
  readonly destinationParentId: string | null
}

export type PendingTreeAction = {
  readonly action: ResourceTreeAction
  readonly node: AdminResourceTreeNode
}

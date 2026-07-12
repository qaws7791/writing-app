"use client"

import type { ItemInstance } from "@headless-tree/core"
import { FileTextIcon, FolderIcon } from "lucide-react"

import type {
  AdminResourceTreeNode,
  AdminResourceTreeScope,
} from "@/features/resources/resource-library-model"
import { ResourceTreeItemActions } from "@/features/resources/tree/resource-tree-actions"
import { resourceTreeRootId } from "@/features/resources/tree/resource-tree-dnd"
import type {
  ResourceTreeAction,
  ResourceTreeItemData,
} from "@/features/resources/tree/resource-tree-types"
import { Spinner } from "@workspace/ui/components/ui/spinner"
import { TreeItem, TreeItemLabel } from "@workspace/ui/components/ui/tree"
import { cn } from "@workspace/ui/lib/utils"

export function ResourceTreeRow({
  item,
  onAction,
  scope,
  structureMutationsAllowed,
}: {
  readonly item: ItemInstance<ResourceTreeItemData>
  readonly onAction: (
    node: AdminResourceTreeNode,
    action: ResourceTreeAction
  ) => void
  readonly scope: AdminResourceTreeScope
  readonly structureMutationsAllowed: boolean
}) {
  const data = item.getItemData()
  const isLoading = data.kind === "loading"
  const canShowActions =
    isResourceNode(data) &&
    structureMutationsAllowed &&
    (scope === "active" || item.getParent()?.getId() === resourceTreeRootId)

  return (
    <TreeItem className="group/resource-tree-item" item={item} render={<div />}>
      <TreeItemLabel
        className={cn(isLoading && "text-muted-foreground")}
        item={item}
      >
        {isLoading ? (
          <Spinner aria-hidden="true" className="size-4" />
        ) : data.kind === "folder" ? (
          <FolderIcon aria-hidden="true" className="size-4" />
        ) : (
          <FileTextIcon aria-hidden="true" className="size-4" />
        )}
        <span className="min-w-0 flex-1 truncate">{data.name}</span>
        {canShowActions ? (
          <ResourceTreeItemActions
            onAction={(action) => {
              onAction(data, action)
            }}
            scope={scope}
          />
        ) : null}
      </TreeItemLabel>
    </TreeItem>
  )
}

function isResourceNode(
  item: ResourceTreeItemData | undefined
): item is AdminResourceTreeNode {
  return item?.kind === "document" || item?.kind === "folder"
}

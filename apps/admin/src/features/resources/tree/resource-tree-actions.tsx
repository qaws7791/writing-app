"use client"

import {
  ArchiveRestoreIcon,
  FolderInputIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import type { ResourceTreeApi } from "@/features/resources/resource-library-api"
import type {
  AdminResourceTreeNode,
  AdminResourceTreeScope,
} from "@/features/resources/resource-library-model"
import { ResourceMoveDialog } from "@/features/resources/tree/resource-move-dialog"
import { ResourceRenameDialog } from "@/features/resources/tree/resource-rename-dialog"
import { ResourceStatusDialog } from "@/features/resources/tree/resource-status-dialog"
import type {
  ResourceTreeAction,
  ResourceTreeMoveInput,
} from "@/features/resources/tree/resource-tree-types"
import { Button } from "@workspace/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"

export type {
  ResourceTreeAction,
  ResourceTreeMoveInput,
} from "@/features/resources/tree/resource-tree-types"

export function ResourceTreeItemActions({
  onAction,
  scope,
}: {
  readonly onAction: (action: ResourceTreeAction) => void
  readonly scope: AdminResourceTreeScope
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="자료 메뉴"
            className="ml-auto size-7 opacity-0 group-hover/resource-tree-item:opacity-100 group-focus-within/resource-tree-item:opacity-100 data-popup-open:opacity-100"
            onClick={(event) => {
              event.stopPropagation()
            }}
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <MoreHorizontalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {scope === "active" ? (
          <>
            <DropdownMenuItem
              onClick={() => {
                onAction("rename")
              }}
            >
              <PencilIcon aria-hidden="true" />
              이름 변경
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onAction("move")
              }}
            >
              <FolderInputIcon aria-hidden="true" />
              이동
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onAction("trash")
              }}
              variant="destructive"
            >
              <Trash2Icon aria-hidden="true" />
              휴지통으로 이동
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              onAction("restore")
            }}
          >
            <ArchiveRestoreIcon aria-hidden="true" />
            복원
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ResourceTreeActionDialog({
  action,
  api,
  node,
  onClose,
  onMove,
  onRename,
  onRestore,
  onTrash,
}: {
  readonly action: ResourceTreeAction | null
  readonly api: ResourceTreeApi
  readonly node: AdminResourceTreeNode | null
  readonly onClose: () => void
  readonly onMove: (input: ResourceTreeMoveInput) => Promise<string | null>
  readonly onRename: (name: string) => Promise<string | null>
  readonly onRestore: () => Promise<string | null>
  readonly onTrash: () => Promise<string | null>
}) {
  if (action === null || node === null) {
    return null
  }

  if (action === "rename") {
    return (
      <ResourceRenameDialog
        key={`${node.id}:rename`}
        node={node}
        onClose={onClose}
        onRename={onRename}
      />
    )
  }

  if (action === "move") {
    return (
      <ResourceMoveDialog
        api={api}
        key={`${node.id}:move`}
        node={node}
        onClose={onClose}
        onMove={onMove}
      />
    )
  }

  return (
    <ResourceStatusDialog
      action={action}
      api={api}
      key={`${node.id}:${action}`}
      node={node}
      onClose={onClose}
      onConfirm={action === "trash" ? onTrash : onRestore}
    />
  )
}

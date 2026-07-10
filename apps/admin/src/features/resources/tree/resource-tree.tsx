"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react"
import {
  asyncDataLoaderFeature,
  dragAndDropFeature,
  hotkeysCoreFeature,
  isOrderedDragTarget,
  selectionFeature,
  type DragTarget,
  type ItemInstance,
  type Updater,
} from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import {
  FilePlus2Icon,
  FileTextIcon,
  FolderIcon,
  FolderPlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import type { ResourceTreeApi } from "@/features/resources/resource-library-api"
import {
  getExpandedResourceIdsSnapshot,
  getServerExpandedResourceIdsSnapshot,
  mergeExpandedResourceIds,
  subscribeExpandedResourceIds,
  updateExpandedResourceIds,
} from "@/features/resources/resource-workspace-state"
import { ResourceSearch } from "@/features/resources/search/resource-search"
import {
  ResourceTreeActionDialog,
  ResourceTreeItemActions,
  type ResourceTreeAction,
  type ResourceTreeMoveInput,
} from "@/features/resources/tree/resource-tree-actions"
import {
  moveResourceIdOptimistically,
  readResourceMoveDestination,
  resourceTreeRootId,
} from "@/features/resources/tree/resource-tree-dnd"
import type {
  AdminResourceSearchItem,
  AdminResourceTree,
  AdminResourceTreeNode,
  AdminResourceTreeScope,
} from "@/lib/api/admin-api"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import { ScrollArea } from "@workspace/ui/components/ui/scroll-area"
import { Spinner } from "@workspace/ui/components/ui/spinner"
import {
  Tree,
  TreeDragLine,
  TreeItem,
  TreeItemLabel,
} from "@workspace/ui/components/ui/tree"
import { cn } from "@workspace/ui/lib/utils"

type ResourceTreeRootItem = {
  readonly kind: "root"
  readonly name: "자료실"
}

type ResourceTreeLoadingItem = {
  readonly kind: "loading"
  readonly name: "불러오는 중"
}

type ResourceTreeItemData =
  | AdminResourceTreeNode
  | ResourceTreeLoadingItem
  | ResourceTreeRootItem

export type InitialResourceTreeState =
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ok"; readonly value: AdminResourceTree }

type PendingTreeAction = {
  readonly action: ResourceTreeAction
  readonly node: AdminResourceTreeNode
}

const rootItem: ResourceTreeRootItem = { kind: "root", name: "자료실" }
const loadingItem: ResourceTreeLoadingItem = {
  kind: "loading",
  name: "불러오는 중",
}

export function ResourceTree({
  adminId,
  api,
  initialTree,
  onInitialTreeConsumed,
  onDocumentOpen,
  scope,
  selectedDocumentId,
  toolbarEnd,
}: {
  readonly adminId: string
  readonly api: ResourceTreeApi
  readonly initialTree?: InitialResourceTreeState
  readonly onInitialTreeConsumed?: () => void
  readonly onDocumentOpen: () => void
  readonly scope: AdminResourceTreeScope
  readonly selectedDocumentId?: string
  readonly toolbarEnd?: ReactNode
}) {
  const router = useRouter()
  const initialTreeRef = useRef(initialTree)
  const isDataLoaderInitializedRef = useRef(false)
  const itemDataRef = useRef(new Map<string, AdminResourceTreeNode>())
  const childrenRequestRef = useRef(
    new Map<string, Promise<{ data: ResourceTreeItemData; id: string }[]>>()
  )
  const mutationInFlightRef = useRef(false)
  const markdownFileInputRef = useRef<HTMLInputElement>(null)
  const revisionRef = useRef(
    initialTree?.status === "ok" ? initialTree.value.revision : null
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialTree?.status === "error" ? initialTree.message : null
  )
  const [shouldLoadRoot] = useState(initialTree === undefined)
  const [isCreating, startCreatingTransition] = useTransition()
  const [isImporting, startImportingTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<PendingTreeAction | null>(
    null
  )
  const subscribeToExpandedItems = useCallback(
    (onChange: () => void) =>
      subscribeExpandedResourceIds(adminId, scope, onChange),
    [adminId, scope]
  )
  const readExpandedItems = useCallback(
    () => getExpandedResourceIdsSnapshot(adminId, scope),
    [adminId, scope]
  )
  const expandedItems = useSyncExternalStore(
    subscribeToExpandedItems,
    readExpandedItems,
    getServerExpandedResourceIdsSnapshot
  )
  const setExpandedItems = useCallback(
    (updater: Updater<string[]>) => {
      updateExpandedResourceIds(adminId, scope, updater)
    },
    [adminId, scope]
  )
  const [selection, setSelection] = useState(() => ({
    documentId: selectedDocumentId,
    itemIds: selectedDocumentId === undefined ? [] : [selectedDocumentId],
  }))

  if (selection.documentId !== selectedDocumentId) {
    setSelection({
      documentId: selectedDocumentId,
      itemIds: selectedDocumentId === undefined ? [] : [selectedDocumentId],
    })
  }

  const selectedItems = selection.itemIds
  const setSelectedItems = useCallback((updater: Updater<string[]>) => {
    setSelection((current) => ({
      ...current,
      itemIds:
        typeof updater === "function" ? updater(current.itemIds) : updater,
    }))
  }, [])

  function acceptTree(treeValue: AdminResourceTree): void {
    revisionRef.current = treeValue.revision
    for (const node of treeValue.nodes) itemDataRef.current.set(node.id, node)
  }

  function loadChildren(itemId: string) {
    const pendingRequest = childrenRequestRef.current.get(itemId)
    if (pendingRequest !== undefined) return pendingRequest

    const request = requestChildren(itemId)
    childrenRequestRef.current.set(itemId, request)
    return request
  }

  async function requestChildren(itemId: string) {
    const parentId = itemId === resourceTreeRootId ? null : itemId
    const result = await api.getResourceTree({ parentId, scope })

    if (result.status === "error") {
      setErrorMessage(result.error.message)
      return []
    }

    acceptTree(result.value)
    setErrorMessage(null)
    return result.value.nodes.map((node) => ({ data: node, id: node.id }))
  }

  const tree = useTree<ResourceTreeItemData>({
    canDrag: (items) =>
      scope === "active" &&
      !mutationInFlightRef.current &&
      items.length === 1 &&
      isResourceNode(items[0]?.getItemData()),
    canDrop: (items, target) =>
      scope === "active" &&
      items.length === 1 &&
      (isOrderedDragTarget(target) || target.item.isFolder()),
    canReorder: true,
    createLoadingItemData: () => loadingItem,
    dataLoader: {
      getChildrenWithData: loadChildren,
      getItem: (itemId) => {
        if (itemId === resourceTreeRootId) return rootItem
        const item = itemDataRef.current.get(itemId)

        if (item === undefined) {
          throw new Error(`자료 트리 항목을 찾을 수 없습니다: ${itemId}`)
        }

        return item
      },
    },
    features: [
      asyncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
    ],
    getItemName: (item) => item.getItemData().name,
    indent: 20,
    isItemFolder: (item) => {
      const data = item.getItemData()
      return data.kind === "root" || data.kind === "folder"
    },
    onDrop: async (items, target) => {
      const item = items[0]
      if (item === undefined) return
      await moveTreeItem(item, target)
    },
    onPrimaryAction: (item) => {
      const data = item.getItemData()
      if (!isResourceNode(data) || data.kind !== "document") return
      openDocument(data.id)
    },
    openOnDropDelay: 600,
    rootItemId: resourceTreeRootId,
    setExpandedItems,
    setSelectedItems,
    state: {
      expandedItems,
      selectedItems,
    },
  })

  useLayoutEffect(() => {
    if (isDataLoaderInitializedRef.current) return
    isDataLoaderInitializedRef.current = true
    const prefetchedTree = initialTreeRef.current
    initialTreeRef.current = undefined

    if (prefetchedTree !== undefined) onInitialTreeConsumed?.()

    if (prefetchedTree?.status === "ok") {
      acceptTree(prefetchedTree.value)
      for (const node of prefetchedTree.value.nodes) {
        tree.getItemInstance(node.id).updateCachedData(node, true)
      }
      tree
        .getRootItem()
        .updateCachedChildrenIds(
          prefetchedTree.value.nodes.map((node) => node.id)
        )
      return
    }

    tree.getRootItem().updateCachedChildrenIds([])
  }, [onInitialTreeConsumed, tree])

  useEffect(() => {
    if (shouldLoadRoot) {
      void tree.getRootItem().invalidateChildrenIds(false)
    }
  }, [shouldLoadRoot, tree])

  async function moveTreeItem(
    item: ItemInstance<ResourceTreeItemData>,
    target: DragTarget<ResourceTreeItemData>
  ): Promise<void> {
    const destination = readResourceMoveDestination(
      isOrderedDragTarget(target)
        ? {
            insertionIndex: target.insertionIndex,
            item: target.item,
            kind: "ordered",
          }
        : { item: target.item, kind: "parent" }
    )

    if (destination === null) return
    const node = item.getItemData()
    if (!isResourceNode(node)) return

    const message = await moveNode(node, destination)
    if (message !== null) setErrorMessage(message)
  }

  async function moveNode(
    node: AdminResourceTreeNode,
    destination: ResourceTreeMoveInput
  ): Promise<string | null> {
    const revision = revisionRef.current
    if (revision === null) return "자료 트리를 먼저 다시 불러와 주세요."
    if (mutationInFlightRef.current)
      return "진행 중인 작업이 끝난 뒤 다시 시도해 주세요."

    mutationInFlightRef.current = true
    const sourceParentItemId = node.parentId ?? resourceTreeRootId
    const destinationParentItemId =
      destination.destinationParentId ?? resourceTreeRootId
    const sourceParent = tree.getItemInstance(sourceParentItemId)
    const destinationParent = tree.getItemInstance(destinationParentItemId)
    const [sourceIds, destinationIds] = await Promise.all([
      tree.loadChildrenIds(sourceParentItemId),
      tree.loadChildrenIds(destinationParentItemId),
    ])
    const optimistic = moveResourceIdOptimistically({
      destinationIds,
      destinationIndex: destination.destinationIndex,
      movingId: node.id,
      sameParent: sourceParentItemId === destinationParentItemId,
      sourceIds,
    })

    sourceParent.updateCachedChildrenIds([...optimistic.sourceIds], true)
    destinationParent.updateCachedChildrenIds(
      [...optimistic.destinationIds],
      true
    )
    tree.rebuildTree()

    const result = await api.moveResourceNode(node.id, {
      ...destination,
      expectedRevision: revision,
    })

    mutationInFlightRef.current = false

    if (result.status === "error") {
      sourceParent.updateCachedChildrenIds([...sourceIds], true)
      destinationParent.updateCachedChildrenIds([...destinationIds], true)
      tree.rebuildTree()
      if (result.error.code === "stale-revision") await reloadVisibleTree()
      return result.error.message
    }

    revisionRef.current = result.value.revision
    itemDataRef.current.set(node.id, result.value.node)
    tree.getItemInstance(node.id).updateCachedData(result.value.node)
    router.refresh()
    setErrorMessage(null)
    return null
  }

  async function createNode(kind: "document" | "folder"): Promise<void> {
    const revision = revisionRef.current
    if (revision === null) {
      setErrorMessage("자료 트리를 먼저 다시 불러와 주세요.")
      return
    }
    if (mutationInFlightRef.current) return

    const parentId = readInsertionParentId(itemDataRef.current, selectedItems)
    const parentItemId = parentId ?? resourceTreeRootId

    mutationInFlightRef.current = true
    const existingIds = await tree.loadChildrenIds(parentItemId)
    const result = await (kind === "folder"
      ? api.createResourceFolder({ expectedRevision: revision, parentId })
      : api.createResourceDocumentNode({
          expectedRevision: revision,
          parentId,
        }))
    mutationInFlightRef.current = false

    if (result.status === "error") {
      if (result.error.code === "stale-revision") await reloadVisibleTree()
      setErrorMessage(result.error.message)
      return
    }

    const node = result.value.node
    revisionRef.current = result.value.revision
    itemDataRef.current.set(node.id, node)
    tree.getItemInstance(node.id).updateCachedData(node, true)
    tree
      .getItemInstance(parentItemId)
      .updateCachedChildrenIds([...existingIds, node.id])
    markParentAsNonEmpty(parentId)
    setExpandedItems((current) =>
      parentId === null
        ? current
        : [...mergeExpandedResourceIds(current, [parentId])]
    )
    setSelectedItems([node.id])
    setErrorMessage(null)

    if (node.kind === "document") openDocument(node.id)
  }

  async function importMarkdownFile(file: File): Promise<void> {
    const revision = revisionRef.current

    if (revision === null) {
      setErrorMessage("자료 트리를 먼저 다시 불러와 주세요.")
      return
    }

    if (!file.name.toLocaleLowerCase("ko-KR").endsWith(".md")) {
      setErrorMessage("Markdown(.md) 파일 하나를 선택해 주세요.")
      return
    }

    if (mutationInFlightRef.current) return

    const parentId = readInsertionParentId(itemDataRef.current, selectedItems)
    const parentItemId = parentId ?? resourceTreeRootId
    const existingIds = await tree.loadChildrenIds(parentItemId)
    const markdown = await file.text()

    mutationInFlightRef.current = true
    const result = await api.importResourceDocument({
      expectedRevision: revision,
      fileName: file.name,
      markdown,
      parentId,
    })
    mutationInFlightRef.current = false

    if (result.status === "error") {
      if (result.error.code === "stale-revision") await reloadVisibleTree()
      setErrorMessage(result.error.message)
      return
    }

    const node = result.value.mutation.node
    revisionRef.current = result.value.mutation.revision
    itemDataRef.current.set(node.id, node)
    tree.getItemInstance(node.id).updateCachedData(node, true)
    tree
      .getItemInstance(parentItemId)
      .updateCachedChildrenIds([...existingIds, node.id])
    markParentAsNonEmpty(parentId)
    setExpandedItems((current) =>
      parentId === null
        ? current
        : [...mergeExpandedResourceIds(current, [parentId])]
    )
    setSelectedItems([node.id])
    setErrorMessage(null)
    openDocument(node.id)
  }

  function markParentAsNonEmpty(parentId: string | null): void {
    if (parentId === null) return
    const parent = itemDataRef.current.get(parentId)
    if (parent?.kind !== "folder" || parent.hasChildren) return
    const updatedParent = { ...parent, hasChildren: true } as const
    itemDataRef.current.set(parentId, updatedParent)
    tree.getItemInstance(parentId).updateCachedData(updatedParent)
  }

  async function renamePendingNode(name: string): Promise<string | null> {
    const node = pendingAction?.node
    const revision = revisionRef.current
    if (node === undefined || revision === null)
      return "자료 트리를 먼저 다시 불러와 주세요."
    if (mutationInFlightRef.current)
      return "진행 중인 작업이 끝난 뒤 다시 시도해 주세요."

    mutationInFlightRef.current = true
    const result = await api.renameResourceNode(node.id, {
      expectedRevision: revision,
      name,
    })
    mutationInFlightRef.current = false

    if (result.status === "error") {
      if (result.error.code === "stale-revision") await reloadVisibleTree()
      return result.error.message
    }

    revisionRef.current = result.value.revision
    itemDataRef.current.set(node.id, result.value.node)
    tree.getItemInstance(node.id).updateCachedData(result.value.node)
    router.refresh()
    setErrorMessage(null)
    return null
  }

  async function trashPendingNode(): Promise<string | null> {
    const node = pendingAction?.node
    const revision = revisionRef.current
    if (node === undefined || revision === null)
      return "자료 트리를 먼저 다시 불러와 주세요."
    if (mutationInFlightRef.current)
      return "진행 중인 작업이 끝난 뒤 다시 시도해 주세요."

    mutationInFlightRef.current = true
    const result = await api.trashResourceNode(node.id, {
      expectedRevision: revision,
    })
    mutationInFlightRef.current = false

    if (result.status === "error") {
      if (result.error.code === "stale-revision") await reloadVisibleTree()
      return result.error.message
    }

    const containsSelectedDocument = isSelectedDocumentInSubtree(node)
    revisionRef.current = result.value.revision
    removeNodeFromCurrentTree(node)
    setErrorMessage(null)
    if (containsSelectedDocument) router.push("/resources")
    return null
  }

  async function restorePendingNode(): Promise<string | null> {
    const node = pendingAction?.node
    const revision = revisionRef.current
    if (node === undefined || revision === null)
      return "자료 트리를 먼저 다시 불러와 주세요."
    if (mutationInFlightRef.current)
      return "진행 중인 작업이 끝난 뒤 다시 시도해 주세요."

    mutationInFlightRef.current = true
    const result = await api.restoreResourceNode(node.id, {
      expectedRevision: revision,
    })
    mutationInFlightRef.current = false

    if (result.status === "error") {
      if (result.error.code === "stale-revision") await reloadVisibleTree()
      return result.error.message
    }

    const containsSelectedDocument = isSelectedDocumentInSubtree(node)
    revisionRef.current = result.value.revision
    removeNodeFromCurrentTree(node)
    setErrorMessage(null)
    if (containsSelectedDocument) router.push("/resources")
    return null
  }

  function isSelectedDocumentInSubtree(node: AdminResourceTreeNode): boolean {
    if (selectedDocumentId === undefined) return false
    if (selectedDocumentId === node.id) return true
    const selectedItem = tree.getItemInstance(selectedDocumentId)
    return (
      selectedItem.getItemMeta().index >= 0 &&
      selectedItem.isDescendentOf(node.id)
    )
  }

  function removeNodeFromCurrentTree(node: AdminResourceTreeNode): void {
    const parentItemId =
      scope === "trash"
        ? resourceTreeRootId
        : (node.parentId ?? resourceTreeRootId)
    const parentItem = tree.getItemInstance(parentItemId)
    const remainingIds = parentItem
      .getChildren()
      .map((child) => child.getId())
      .filter((id) => id !== node.id)
    parentItem.updateCachedChildrenIds(remainingIds)
    setSelectedItems((current) => current.filter((id) => id !== node.id))
  }

  async function reloadVisibleTree(): Promise<void> {
    const folders = [
      tree.getRootItem(),
      ...tree.getItems().filter((item) => item.isFolder()),
    ]
    for (const folder of folders)
      childrenRequestRef.current.delete(folder.getId())
    await Promise.all(
      [...new Map(folders.map((item) => [item.getId(), item])).values()].map(
        (item) => item.invalidateChildrenIds(false)
      )
    )
  }

  function openDocument(documentId: string): void {
    router.push(
      scope === "trash"
        ? `/resources/${documentId}?scope=trash`
        : `/resources/${documentId}`
    )
    onDocumentOpen()
  }

  function selectSearchResult(item: AdminResourceSearchItem): void {
    setExpandedItems((current) => [
      ...mergeExpandedResourceIds(current, [
        ...item.path.map((part) => part.id),
        ...(item.kind === "folder" ? [item.id] : []),
      ]),
    ])
    setSelectedItems([item.id])
    if (item.kind === "document") openDocument(item.id)
  }

  const items = tree.getItems()
  const isRootLoading = tree.getRootItem().isLoading()

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface/40">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <Button
          className="flex-1"
          disabled={scope === "trash" || isCreating}
          onClick={() => {
            startCreatingTransition(async () => {
              await createNode("document")
            })
          }}
          size="sm"
          type="button"
        >
          <FilePlus2Icon aria-hidden="true" />
          새 문서
        </Button>
        <Button
          aria-label="새 폴더"
          disabled={scope === "trash" || isCreating}
          onClick={() => {
            startCreatingTransition(async () => {
              await createNode("folder")
            })
          }}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          {isCreating ? (
            <Spinner aria-hidden="true" />
          ) : (
            <FolderPlusIcon aria-hidden="true" />
          )}
        </Button>
        <input
          accept=".md,text/markdown"
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ""

            if (file === null || file === undefined) return

            startImportingTransition(async () => {
              await importMarkdownFile(file)
            })
          }}
          ref={markdownFileInputRef}
          type="file"
        />
        <Button
          aria-label="Markdown 파일 가져오기"
          disabled={scope === "trash" || isCreating || isImporting}
          onClick={() => {
            markdownFileInputRef.current?.click()
          }}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          {isImporting ? (
            <Spinner aria-hidden="true" />
          ) : (
            <UploadIcon aria-hidden="true" />
          )}
        </Button>
        {toolbarEnd}
      </div>
      <ResourceSearch api={api} onSelect={selectSearchResult} scope={scope} />
      <nav
        aria-label="자료실 범위"
        className="grid grid-cols-2 gap-1 px-3 py-2"
      >
        <Link
          aria-current={scope === "active" ? "page" : undefined}
          className={buttonVariants({
            size: "sm",
            variant: scope === "active" ? "secondary" : "ghost",
          })}
          href="/resources"
        >
          <FolderIcon aria-hidden="true" />
          자료
        </Link>
        <Link
          aria-current={scope === "trash" ? "page" : undefined}
          className={buttonVariants({
            size: "sm",
            variant: scope === "trash" ? "secondary" : "ghost",
          })}
          href="/resources/trash"
        >
          <Trash2Icon aria-hidden="true" />
          휴지통
        </Link>
      </nav>
      {errorMessage === null ? null : (
        <div className="px-3 pb-2">
          <Alert role="alert" tone="danger">
            <AlertDescription className="flex items-center justify-between gap-2">
              <span>{errorMessage}</span>
              <Button
                aria-label="자료 트리 다시 불러오기"
                onClick={() => {
                  void reloadVisibleTree()
                }}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <RefreshCwIcon aria-hidden="true" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
        <Tree aria-label="자료 폴더와 문서" tree={tree}>
          {items.map((item) => {
            const data = item.getItemData()
            const isLoading = data.kind === "loading"
            const canShowActions =
              isResourceNode(data) &&
              (scope === "active" ||
                item.getParent()?.getId() === resourceTreeRootId)

            return (
              <TreeItem
                className="group/resource-tree-item"
                item={item}
                key={item.getId()}
                render={<div />}
              >
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
                        setPendingAction({ action, node: data })
                      }}
                      scope={scope}
                    />
                  ) : null}
                </TreeItemLabel>
              </TreeItem>
            )
          })}
          <TreeDragLine />
        </Tree>
        {isRootLoading ? (
          <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
            <Spinner aria-hidden="true" />
            자료를 불러오는 중입니다.
          </div>
        ) : items.length === 0 && errorMessage === null ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            {scope === "trash"
              ? "휴지통이 비어 있습니다."
              : "첫 자료를 만들어 보세요."}
          </p>
        ) : null}
      </ScrollArea>
      <ResourceTreeActionDialog
        action={pendingAction?.action ?? null}
        api={api}
        node={pendingAction?.node ?? null}
        onClose={() => {
          setPendingAction(null)
        }}
        onMove={(input) => {
          const node = pendingAction?.node
          return node === undefined
            ? Promise.resolve("이동할 자료를 찾을 수 없습니다.")
            : moveNode(node, input)
        }}
        onRename={renamePendingNode}
        onRestore={restorePendingNode}
        onTrash={trashPendingNode}
      />
    </div>
  )
}

function isResourceNode(
  item: ResourceTreeItemData | undefined
): item is AdminResourceTreeNode {
  return item?.kind === "document" || item?.kind === "folder"
}

function readSelectedResourceNode(
  itemData: ReadonlyMap<string, AdminResourceTreeNode>,
  selectedItems: readonly string[]
): AdminResourceTreeNode | null {
  const selectedId = selectedItems[0]
  if (selectedId === undefined) return null
  return itemData.get(selectedId) ?? null
}

function readInsertionParentId(
  itemData: ReadonlyMap<string, AdminResourceTreeNode>,
  selectedItems: readonly string[]
): string | null {
  const selectedNode = readSelectedResourceNode(itemData, selectedItems)

  return selectedNode?.kind === "folder"
    ? selectedNode.id
    : (selectedNode?.parentId ?? null)
}

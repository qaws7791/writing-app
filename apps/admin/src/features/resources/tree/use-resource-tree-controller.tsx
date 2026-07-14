"use client"

import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
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
import type { AdminId } from "@/lib/api/admin-identity"
import type { ResourceTreeApi } from "@/features/resources/resource-library-api"
import {
  classifyResourceEventRevision,
  recordBrowserResourceEventRevisionGap,
  type ResourceEventRevisionGapRecorder,
  type ResourceEventsConnector,
} from "@/features/resources/resource-events-client"
import {
  getExpandedResourceIdsSnapshot,
  getServerExpandedResourceIdsSnapshot,
  mergeExpandedResourceIds,
  subscribeExpandedResourceIds,
  updateExpandedResourceIds,
} from "@/features/resources/resource-workspace-state"
import {
  canDragResourceTreeItem,
  canDropResourceTreeItem,
  moveResourceIdOptimistically,
  readResourceMoveDestination,
  resourceTreeRootId,
} from "@/features/resources/tree/resource-tree-dnd"
import type {
  AdminResourceEvent,
  AdminResourceSearchItem,
  AdminResourceTree,
  AdminResourceTreeNode,
  AdminResourceTreeScope,
} from "@/features/resources/resource-library-model"
import type {
  InitialResourceTreeState,
  ResourceTreeItemData,
  ResourceTreeLoadingItem,
  ResourceTreeMoveInput,
  ResourceTreeRootItem,
} from "@/features/resources/tree/resource-tree-types"
import { useResourceTreeState } from "@/features/resources/tree/resource-tree-state"

const rootItem: ResourceTreeRootItem = { kind: "root", name: "자료실" }
const loadingItem: ResourceTreeLoadingItem = {
  kind: "loading",
  name: "불러오는 중",
}
const resourceConnectionWarningDelayMilliseconds = 750

export function useResourceTreeController({
  adminId,
  api,
  connectEvents,
  eventsServerUrl,
  initialTree,
  onInitialTreeConsumed,
  onDocumentOpen,
  recordRevisionGap = recordBrowserResourceEventRevisionGap,
  scope,
  selectedDocumentId,
}: {
  readonly adminId: AdminId
  readonly api: ResourceTreeApi
  readonly connectEvents: ResourceEventsConnector
  readonly eventsServerUrl: string
  readonly initialTree?: InitialResourceTreeState
  readonly onInitialTreeConsumed?: () => void
  readonly onDocumentOpen: () => void
  readonly recordRevisionGap?: ResourceEventRevisionGapRecorder
  readonly scope: AdminResourceTreeScope
  readonly selectedDocumentId?: string
}) {
  const router = useRouter()
  const initialTreeRef = useRef(initialTree)
  const isDataLoaderInitializedRef = useRef(false)
  const itemDataRef = useRef(new Map<string, AdminResourceTreeNode>())
  const childrenRequestRef = useRef(
    new Map<string, Promise<{ data: ResourceTreeItemData; id: string }[]>>()
  )
  const mutationInFlightRef = useRef(false)
  const mutationCompletionRef = useRef<Promise<void>>(Promise.resolve())
  const eventOperationRef = useRef(Promise.resolve())
  const markdownFileInputRef = useRef<HTMLInputElement>(null)
  const revisionRef = useRef(
    initialTree?.status === "ok" ? initialTree.value.revision : null
  )
  const {
    errorMessage,
    pendingAction,
    reportConnected,
    reportConnectionInterrupted,
    reportReconnecting,
    setErrorMessage,
    setPendingAction,
    workspaceConnectionState,
  } = useResourceTreeState(
    initialTree?.status === "error" ? initialTree.message : null
  )
  const [shouldLoadRoot] = useState(initialTree === undefined)
  const [isCreating, startCreatingTransition] = useTransition()
  const [isImporting, startImportingTransition] = useTransition()
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
  const structureMutationsAllowed = workspaceConnectionState === "online"

  function beginResourceMutation(): () => void {
    let completeMutation: () => void = () => {}
    mutationCompletionRef.current = new Promise<void>((resolve) => {
      completeMutation = resolve
    })
    mutationInFlightRef.current = true

    return () => {
      mutationInFlightRef.current = false
      completeMutation()
    }
  }

  function acceptTree(treeValue: AdminResourceTree): void {
    revisionRef.current = treeValue.revision
    for (const node of treeValue.nodes) itemDataRef.current.set(node.id, node)
  }

  function loadChildren(itemId: string) {
    const pendingRequest = childrenRequestRef.current.get(itemId)
    if (pendingRequest !== undefined) return pendingRequest

    const request = requestChildren(itemId).finally(() => {
      if (childrenRequestRef.current.get(itemId) === request) {
        childrenRequestRef.current.delete(itemId)
      }
    })
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
      canDragResourceTreeItem({
        itemCount: items.length,
        itemKind: items[0]?.getItemData().kind,
        mutationInFlight: mutationInFlightRef.current,
        scope,
        structureMutationsAllowed,
      }),
    canDrop: (items, target) =>
      canDropResourceTreeItem({
        itemCount: items.length,
        itemKind: items[0]?.getItemData().kind,
        scope,
        structureMutationsAllowed,
        targetIsFolder: target.item.isFolder(),
        targetKind: isOrderedDragTarget(target) ? "ordered" : "parent",
      }),
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

    const completeMutation = beginResourceMutation()
    try {
      const existingIds = await tree.loadChildrenIds(parentItemId)
      const result = await (kind === "folder"
        ? api.createResourceFolder({ expectedRevision: revision, parentId })
        : api.createResourceDocumentNode({
            expectedRevision: revision,
            parentId,
          }))

      if (result.status === "error") {
        if (result.error.code === "stale-revision") await reloadVisibleTree()
        setErrorMessage(result.error.message)
        return
      }

      const node = acceptCreatedNode({
        existingIds,
        node: result.value.node,
        parentId,
        parentItemId,
        revision: result.value.revision,
      })
      setExpandedItems((current) =>
        parentId === null
          ? current
          : [...mergeExpandedResourceIds(current, [parentId])]
      )
      setSelectedItems([node.id])
      setErrorMessage(null)

      if (node.kind === "document") openDocument(node.id)
    } finally {
      completeMutation()
    }
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

    const completeMutation = beginResourceMutation()
    try {
      const result = await api.importResourceDocument({
        expectedRevision: revision,
        fileName: file.name,
        markdown,
        parentId,
      })

      if (result.status === "error") {
        if (result.error.code === "stale-revision") await reloadVisibleTree()
        setErrorMessage(result.error.message)
        return
      }

      const node = acceptCreatedNode({
        existingIds,
        node: result.value.mutation.node,
        parentId,
        parentItemId,
        revision: result.value.mutation.revision,
      })
      setExpandedItems((current) =>
        parentId === null
          ? current
          : [...mergeExpandedResourceIds(current, [parentId])]
      )
      setSelectedItems([node.id])
      setErrorMessage(null)
      openDocument(node.id)
    } finally {
      completeMutation()
    }
  }

  function acceptCreatedNode(input: {
    readonly existingIds: readonly string[]
    readonly node: AdminResourceTreeNode
    readonly parentId: string | null
    readonly parentItemId: string
    readonly revision: number
  }): AdminResourceTreeNode {
    revisionRef.current = input.revision
    itemDataRef.current.set(input.node.id, input.node)
    tree.getItemInstance(input.node.id).updateCachedData(input.node, true)
    tree
      .getItemInstance(input.parentItemId)
      .updateCachedChildrenIds(
        [...new Set([...input.existingIds, input.node.id])],
        true
      )
    markParentAsNonEmpty(input.parentId)
    tree.rebuildTree()
    return input.node
  }

  function markParentAsNonEmpty(parentId: string | null): void {
    if (parentId === null) return
    const parent = itemDataRef.current.get(parentId)
    if (parent?.kind !== "folder" || parent.hasChildren) return
    const updatedParent = { ...parent, hasChildren: true } as const
    itemDataRef.current.set(parentId, updatedParent)
    tree.getItemInstance(parentId).updateCachedData(updatedParent, true)
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

  async function reloadAffectedParents(
    affectedParentIds: readonly (string | null)[]
  ): Promise<void> {
    const parentItemIds = [
      ...new Set(
        affectedParentIds.map((parentId) => parentId ?? resourceTreeRootId)
      ),
    ]

    await Promise.all(
      parentItemIds.flatMap((parentItemId) => {
        if (
          parentItemId !== resourceTreeRootId &&
          !itemDataRef.current.has(parentItemId)
        ) {
          return []
        }

        childrenRequestRef.current.delete(parentItemId)
        return [tree.getItemInstance(parentItemId).invalidateChildrenIds(false)]
      })
    )
  }

  async function handleResourceEvent(event: AdminResourceEvent): Promise<void> {
    const currentRevision = revisionRef.current

    if (event.type === "resource-document-title-confirmed") {
      if (currentRevision !== null && event.revision < currentRevision) return

      const node = itemDataRef.current.get(event.documentId)

      if (node?.kind === "document") {
        const renamedNode = { ...node, name: event.name }

        itemDataRef.current.set(node.id, renamedNode)
        tree.getItemInstance(node.id).updateCachedData(renamedNode)
        tree.rebuildTree()
      }
      if (selectedDocumentId === event.documentId) router.refresh()
      return
    }

    const revisionSequence = classifyResourceEventRevision(
      currentRevision,
      event.revision
    )

    if (revisionSequence === "gap") {
      recordRevisionGap({
        currentRevision,
        incomingRevision: event.revision,
      })
      await reloadVisibleTree()
      return
    }

    if (revisionSequence === "stale") return

    if (event.action === "trash") {
      const eventNode = itemDataRef.current.get(event.nodeId)

      if (eventNode !== undefined && isSelectedDocumentInSubtree(eventNode)) {
        router.push("/resources")
      }
    }

    revisionRef.current = event.revision
    await reloadAffectedParents(event.affectedParentIds)
  }

  const onResourceEvent = useEffectEvent(handleResourceEvent)
  const onResourceEventError = useEffectEvent(reloadVisibleTree)

  useEffect(() => {
    let connectionWarningTimer: ReturnType<typeof setTimeout> | null = null
    const subscription = connectEvents({
      onConnectionChange(connected) {
        if (connected) {
          if (connectionWarningTimer !== null) {
            clearTimeout(connectionWarningTimer)
            connectionWarningTimer = null
          }
          reportConnected()
          return
        }

        reportConnectionInterrupted()
        if (connectionWarningTimer !== null) return

        connectionWarningTimer = setTimeout(() => {
          connectionWarningTimer = null
          reportReconnecting()
        }, resourceConnectionWarningDelayMilliseconds)
      },
      onError() {
        eventOperationRef.current = eventOperationRef.current
          .then(() => onResourceEventError())
          .catch(() => {
            setErrorMessage("자료실 실시간 변경을 다시 불러오지 못했습니다.")
          })
      },
      onEvent(event) {
        const mutationCompletion = mutationCompletionRef.current
        eventOperationRef.current = eventOperationRef.current
          .then(() => mutationCompletion)
          .then(() => onResourceEvent(event))
          .catch(() => {
            setErrorMessage("자료실 실시간 변경을 반영하지 못했습니다.")
          })
      },
      serverUrl: eventsServerUrl,
    })

    return () => {
      if (connectionWarningTimer !== null) {
        clearTimeout(connectionWarningTimer)
      }
      subscription.disconnect()
    }
  }, [
    connectEvents,
    eventsServerUrl,
    reportConnected,
    reportConnectionInterrupted,
    reportReconnecting,
    setErrorMessage,
  ])

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

  function movePendingNode(
    input: ResourceTreeMoveInput
  ): Promise<string | null> {
    const node = pendingAction?.node

    return node === undefined
      ? Promise.resolve("이동할 자료를 찾을 수 없습니다.")
      : moveNode(node, input)
  }

  return {
    api,
    createNode,
    errorMessage,
    expandedItems,
    importMarkdownFile,
    isCreating,
    isImporting,
    isRootLoading: tree.getRootItem().isLoading(),
    items: tree.getItems(),
    markdownFileInputRef,
    movePendingNode,
    pendingAction,
    reloadVisibleTree,
    renamePendingNode,
    restorePendingNode,
    scope,
    selectSearchResult,
    setPendingAction,
    startCreatingTransition,
    startImportingTransition,
    structureMutationsAllowed,
    trashPendingNode,
    tree,
    workspaceConnectionState,
  }
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

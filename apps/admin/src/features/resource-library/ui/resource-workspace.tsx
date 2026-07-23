"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FilePlusIcon,
  FileTextIcon,
  FolderIcon,
  FolderPlusIcon,
  PencilIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { cn } from "@workspace/ui/lib/utils"

import { createBrowserResourceLibraryApi } from "@/features/resource-library/api/resource-library-api"
import {
  resourceLibraryScopePaths,
  resolveResourceLibraryScope,
  type ResourceLibraryScope,
} from "@/features/resource-library/model/resource-library-scope"
import type {
  AdminResourceSearch,
  AdminResourceTree,
  AdminResourceTreeNode,
} from "@/entities/resource-document/model/resource-document"
import { resourceLibraryChangedEvent } from "@/entities/resource-document/model/resource-document"

export function ResourceWorkspace({
  children,
  initialScope,
  initialTree,
}: {
  readonly children: ReactNode
  readonly initialScope: ResourceLibraryScope
  readonly initialTree: AdminResourceTree | null
}) {
  const api = useMemo(() => createBrowserResourceLibraryApi(), [])
  const pathname = usePathname()
  const router = useRouter()
  const scope = resolveResourceLibraryScope(pathname)
  const currentDocumentId = getCurrentResourceDocumentId(pathname)
  const importInputRef = useRef<HTMLInputElement>(null)
  const loadedScopeRef = useRef<ResourceLibraryScope>(initialScope)
  const [nodes, setNodes] = useState<readonly AdminResourceTreeNode[]>(
    initialTree?.nodes ?? []
  )
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(initialTree?.nodes.filter(isFolder).map((node) => node.id))
  )
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState<AdminResourceSearch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const result = await api.getResourceTree(scope)
    if (result.status === "error") {
      setError(result.error.message)
      return
    }
    loadedScopeRef.current = scope
    setNodes(result.value.nodes)
    setError(null)
  }, [api, scope])

  useEffect(() => {
    if (loadedScopeRef.current === scope) return
    let cancelled = false
    void api.getResourceTree(scope).then((result) => {
      if (cancelled) return
      if (result.status === "error") {
        setError(result.error.message)
        return
      }
      loadedScopeRef.current = scope
      setNodes(result.value.nodes)
      setError(null)
    })
    return () => {
      cancelled = true
    }
  }, [api, scope])

  useEffect(() => {
    const onFocus = () => void refresh()
    window.addEventListener("focus", onFocus)
    window.addEventListener(resourceLibraryChangedEvent, onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener(resourceLibraryChangedEvent, onFocus)
    }
  }, [refresh])

  useEffect(() => {
    if (query.trim().length === 0 || scope === "trash") return
    let cancelled = false
    const timeout = window.setTimeout(async () => {
      const result = await api.searchResources(query.trim())
      if (!cancelled) {
        setSearch(result.status === "ok" ? result.value : null)
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [api, query, scope])

  const runMutation = useCallback(
    async (
      mutation: () => Promise<{
        readonly status: string
        readonly error?: { readonly message: string }
      }>
    ) => {
      setBusy(true)
      const result = await mutation()
      setBusy(false)
      if (result.status === "error") {
        setError(result.error?.message ?? "자료실을 변경하지 못했습니다.")
        return false
      }
      await refresh()
      return true
    },
    [refresh]
  )

  const moveNode = useCallback(
    async (nodeId: string, destinationParentId: string | null) => {
      await runMutation(() =>
        api.moveResourceNode(nodeId, { destinationParentId })
      )
    },
    [api, runMutation]
  )

  const renderTree = () => (
    <ResourceTree
      busy={busy}
      confirmDeleteId={confirmDeleteId}
      expanded={expanded}
      nodes={nodes}
      onConfirmDelete={async (nodeId) => {
        const closesCurrentDocument =
          currentDocumentId !== null &&
          isNodeInSubtree(nodes, nodeId, currentDocumentId)
        if (await runMutation(() => api.deleteResourceNode(nodeId))) {
          setConfirmDeleteId(null)
          if (closesCurrentDocument) router.push("/resources")
        }
      }}
      onDrop={moveNode}
      onOpenDocument={(documentId) => router.push(`/resources/${documentId}`)}
      onRename={async (folderId) => {
        if (
          await runMutation(() =>
            api.renameResourceFolder(folderId, { name: renameValue })
          )
        ) {
          setRenamingId(null)
        }
      }}
      onRestore={async (nodeId) => {
        const refreshesCurrentDocument =
          currentDocumentId !== null &&
          isNodeInSubtree(nodes, nodeId, currentDocumentId)
        const restored = await runMutation(() =>
          api.restoreResourceNode(nodeId)
        )
        if (restored && refreshesCurrentDocument) router.refresh()
        return restored
      }}
      onSelectFolder={setSelectedFolderId}
      onStartDelete={setConfirmDeleteId}
      onStartRename={(node) => {
        setRenamingId(node.id)
        setRenameValue(node.name)
      }}
      onToggle={(folderId) => {
        setExpanded((current) => {
          const next = new Set(current)
          if (next.has(folderId)) next.delete(folderId)
          else next.add(folderId)
          return next
        })
      }}
      onTrash={async (nodeId) => {
        const closesCurrentDocument =
          currentDocumentId !== null &&
          isNodeInSubtree(nodes, nodeId, currentDocumentId)
        const trashed = await runMutation(() => api.trashResourceNode(nodeId))
        if (trashed && closesCurrentDocument) router.push("/resources")
        return trashed
      }}
      renameValue={renameValue}
      renamingId={renamingId}
      scope={scope}
      selectedFolderId={selectedFolderId}
      setRenameValue={setRenameValue}
    />
  )

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex flex-1 items-center justify-center px-6 text-center md:hidden">
        <p className="text-sm text-muted-foreground">
          자료실 편집은 데스크톱 브라우저에서 사용할 수 있습니다.
        </p>
      </div>
      <aside className="hidden w-80 shrink-0 flex-col border-r border-border bg-surface/40 md:flex">
        <div className="grid gap-3 border-b border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">관리자 자료실</h2>
            <div className="flex gap-1">
              <Button
                aria-label="새 폴더"
                disabled={busy || scope === "trash"}
                onClick={() =>
                  void runMutation(() =>
                    api.createResourceFolder(selectedFolderId)
                  )
                }
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <FolderPlusIcon aria-hidden="true" />
              </Button>
              <Button
                aria-label="새 문서"
                disabled={busy || scope === "trash"}
                onClick={async () => {
                  setBusy(true)
                  const result =
                    await api.createResourceDocument(selectedFolderId)
                  setBusy(false)
                  if (result.status === "error") {
                    setError(result.error.message)
                    return
                  }
                  await refresh()
                  router.push(`/resources/${result.value.node.id}`)
                }}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <FilePlusIcon aria-hidden="true" />
              </Button>
              <Button
                aria-label="Markdown 가져오기"
                disabled={busy || scope === "trash"}
                onClick={() => importInputRef.current?.click()}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <UploadIcon aria-hidden="true" />
              </Button>
            </div>
          </div>
          <input
            accept=".md,text/markdown"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              event.currentTarget.value = ""
              if (file === undefined) return
              setBusy(true)
              const result = await api.importResourceDocument({
                fileName: file.name,
                markdown: await file.text(),
                parentId: selectedFolderId,
              })
              setBusy(false)
              if (result.status === "error") {
                setError(result.error.message)
                return
              }
              await refresh()
              router.push(`/resources/${result.value.document.id}`)
            }}
            ref={importInputRef}
            type="file"
          />
          <div className="relative">
            <SearchIcon
              aria-hidden="true"
              className="absolute top-2.5 left-3 size-4 text-muted-foreground"
            />
            <Input
              aria-label="자료 검색"
              className="pl-9"
              disabled={scope === "trash"}
              onChange={(event) => {
                setQuery(event.target.value)
                if (event.target.value.trim().length === 0) setSearch(null)
              }}
              placeholder="문서 제목과 본문 검색"
              value={query}
            />
          </div>
          {search === null ? null : (
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-background p-1">
              {search.items.map((item) => (
                <button
                  className="block w-full rounded-md px-3 py-2 text-left hover:bg-muted"
                  key={item.id}
                  onClick={() => {
                    setQuery("")
                    setSearch(null)
                    router.push(`/resources/${item.id}`)
                  }}
                  type="button"
                >
                  <span className="block truncate text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.excerpt ??
                      item.path.map((part) => part.name).join(" / ")}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["active", "trash"] as const).map((value) => (
              <Button
                aria-pressed={scope === value}
                key={value}
                onClick={() => {
                  if (scope === value) return
                  setSelectedFolderId(null)
                  setSearch(null)
                  router.push(resourceLibraryScopePaths[value])
                }}
                size="sm"
                type="button"
                variant={scope === value ? "secondary" : "ghost"}
              >
                {value === "active" ? "자료" : "휴지통"}
              </Button>
            ))}
          </div>
        </div>
        {error === null ? null : (
          <p
            className="border-b border-border px-4 py-2 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        <div
          className="min-h-0 flex-1 overflow-y-auto p-2"
          onDragOver={(event) => {
            if (scope === "active") event.preventDefault()
          }}
          onDrop={(event) => {
            if (scope !== "active") return
            event.preventDefault()
            const nodeId = event.dataTransfer.getData("text/resource-node-id")
            if (nodeId.length > 0) void moveNode(nodeId, null)
          }}
        >
          {renderTree()}
        </div>
      </aside>
      <main className="hidden min-w-0 flex-1 overflow-y-auto md:block">
        {children}
      </main>
    </div>
  )
}

function ResourceTree({
  nodes,
  ...props
}: ResourceTreeProps & { readonly nodes: readonly AdminResourceTreeNode[] }) {
  const nodesByParent = useMemo(() => {
    const ids = new Set(nodes.map((node) => node.id))
    const result = new Map<string | null, AdminResourceTreeNode[]>()
    for (const node of nodes) {
      const parentId =
        node.parentId !== null && ids.has(node.parentId) ? node.parentId : null
      const siblings = result.get(parentId) ?? []
      siblings.push(node)
      result.set(parentId, siblings)
    }
    for (const siblings of result.values()) {
      siblings.sort((left, right) => left.name.localeCompare(right.name, "ko"))
    }
    return result
  }, [nodes])

  const renderNodes = (parentId: string | null, depth: number): ReactNode =>
    nodesByParent.get(parentId)?.map((node) => (
      <div key={node.id}>
        <ResourceTreeRow depth={depth} node={node} {...props} />
        {node.kind === "folder" && props.expanded.has(node.id)
          ? renderNodes(node.id, depth + 1)
          : null}
      </div>
    )) ?? null

  return nodes.length === 0 ? (
    <p className="px-3 py-8 text-center text-sm text-muted-foreground">
      {props.scope === "active"
        ? "자료가 없습니다."
        : "휴지통이 비어 있습니다."}
    </p>
  ) : (
    <div role="tree">{renderNodes(null, 0)}</div>
  )
}

type ResourceTreeProps = {
  readonly busy: boolean
  readonly confirmDeleteId: string | null
  readonly expanded: ReadonlySet<string>
  readonly onConfirmDelete: (nodeId: string) => Promise<void>
  readonly onDrop: (nodeId: string, parentId: string | null) => Promise<void>
  readonly onOpenDocument: (documentId: string) => void
  readonly onRename: (folderId: string) => Promise<void>
  readonly onRestore: (nodeId: string) => Promise<boolean>
  readonly onSelectFolder: (folderId: string) => void
  readonly onStartDelete: (nodeId: string | null) => void
  readonly onStartRename: (node: AdminResourceTreeNode) => void
  readonly onToggle: (folderId: string) => void
  readonly onTrash: (nodeId: string) => Promise<boolean>
  readonly renameValue: string
  readonly renamingId: string | null
  readonly scope: "active" | "trash"
  readonly selectedFolderId: string | null
  readonly setRenameValue: (value: string) => void
}

function ResourceTreeRow({
  depth,
  node,
  ...props
}: ResourceTreeProps & {
  readonly depth: number
  readonly node: AdminResourceTreeNode
}) {
  const isFolder = node.kind === "folder"
  const isRenaming = props.renamingId === node.id
  const Icon = isFolder ? FolderIcon : FileTextIcon

  return (
    <div
      className={cn(
        "group flex min-h-9 items-center gap-1 rounded-md pr-1 text-sm hover:bg-muted",
        props.selectedFolderId === node.id && "bg-muted"
      )}
      draggable={props.scope === "active" && !props.busy}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/resource-node-id", node.id)
        event.dataTransfer.effectAllowed = "move"
      }}
      onDragOver={(event) => {
        if (isFolder && props.scope === "active") event.preventDefault()
      }}
      onDrop={(event) => {
        if (!isFolder || props.scope !== "active") return
        event.preventDefault()
        event.stopPropagation()
        const draggedId = event.dataTransfer.getData("text/resource-node-id")
        if (draggedId.length > 0 && draggedId !== node.id) {
          void props.onDrop(draggedId, node.id)
        }
      }}
      role="treeitem"
      style={{ paddingLeft: `${depth * 16 + 4}px` }}
    >
      {isFolder ? (
        <button
          aria-label={props.expanded.has(node.id) ? "폴더 접기" : "폴더 펼치기"}
          className="grid size-7 place-items-center"
          onClick={() => props.onToggle(node.id)}
          type="button"
        >
          {props.expanded.has(node.id) ? (
            <ChevronDownIcon className="size-4" />
          ) : (
            <ChevronRightIcon className="size-4" />
          )}
        </button>
      ) : (
        <span className="w-7" />
      )}
      <Icon
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      {isRenaming ? (
        <form
          className="flex min-w-0 flex-1 gap-1"
          onSubmit={(event) => {
            event.preventDefault()
            void props.onRename(node.id)
          }}
        >
          <Input
            aria-label="폴더 이름"
            autoFocus
            className="h-7"
            onChange={(event) => props.setRenameValue(event.target.value)}
            value={props.renameValue}
          />
        </form>
      ) : (
        <button
          className="min-w-0 flex-1 truncate py-2 text-left"
          onClick={() =>
            isFolder
              ? props.onSelectFolder(node.id)
              : props.onOpenDocument(node.id)
          }
          type="button"
        >
          {node.name}
        </button>
      )}
      {props.scope === "active" ? (
        <>
          {isFolder ? (
            <Button
              aria-label="폴더 이름 변경"
              className="opacity-0 group-hover:opacity-100 focus:opacity-100"
              onClick={() => props.onStartRename(node)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <PencilIcon aria-hidden="true" />
            </Button>
          ) : null}
          <Button
            aria-label="휴지통으로 이동"
            className="opacity-0 group-hover:opacity-100 focus:opacity-100"
            onClick={() => void props.onTrash(node.id)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
        </>
      ) : depth > 0 ? null : props.confirmDeleteId === node.id ? (
        <span className="flex items-center gap-1">
          <Button
            onClick={() => props.onStartDelete(null)}
            size="sm"
            type="button"
            variant="ghost"
          >
            취소
          </Button>
          <Button
            onClick={() => void props.onConfirmDelete(node.id)}
            size="sm"
            type="button"
            variant="destructive"
          >
            삭제
          </Button>
        </span>
      ) : (
        <>
          <Button
            aria-label="복원"
            onClick={() => void props.onRestore(node.id)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <RotateCcwIcon aria-hidden="true" />
          </Button>
          <Button
            aria-label="영구 삭제"
            onClick={() => props.onStartDelete(node.id)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
        </>
      )}
    </div>
  )
}

function isFolder(
  node: AdminResourceTreeNode
): node is Extract<AdminResourceTreeNode, { readonly kind: "folder" }> {
  return node.kind === "folder"
}

function getCurrentResourceDocumentId(pathname: string): string | null {
  const match = /^\/resources\/([^/?]+)$/.exec(pathname)
  return match?.[1] ?? null
}

function isNodeInSubtree(
  nodes: readonly AdminResourceTreeNode[],
  rootId: string,
  candidateId: string
): boolean {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  let currentId: string | null = candidateId
  while (currentId !== null) {
    if (currentId === rootId) return true
    currentId = nodesById.get(currentId)?.parentId ?? null
  }
  return false
}

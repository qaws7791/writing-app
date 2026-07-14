"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import {
  FilePlus2Icon,
  FolderIcon,
  FolderPlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { ResourceSearch } from "@/features/resources/search/resource-search"
import { ResourceTreeActionDialog } from "@/features/resources/tree/resource-tree-actions"
import { ResourceTreeRow } from "@/features/resources/tree/resource-tree-row"
import type { useResourceTreeController } from "@/features/resources/tree/use-resource-tree-controller"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import { ScrollArea } from "@workspace/ui/components/ui/scroll-area"
import { Spinner } from "@workspace/ui/components/ui/spinner"
import { Tree, TreeDragLine } from "@workspace/ui/components/ui/tree"

type ResourceTreeController = ReturnType<typeof useResourceTreeController>

export function ResourceTreeView({
  controller,
  toolbarEnd,
}: {
  readonly controller: ResourceTreeController
  readonly toolbarEnd?: ReactNode
}) {
  const {
    api,
    createNode,
    errorMessage,
    expandedItems,
    importMarkdownFile,
    isCreating,
    isImporting,
    isRootLoading,
    items,
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
  } = controller

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface/40">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <Button
          className="flex-1"
          disabled={
            scope === "trash" || !structureMutationsAllowed || isCreating
          }
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
          disabled={
            scope === "trash" || !structureMutationsAllowed || isCreating
          }
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
          disabled={
            scope === "trash" ||
            !structureMutationsAllowed ||
            isCreating ||
            isImporting
          }
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
      {workspaceConnectionState === "reconnecting" ||
      workspaceConnectionState === "unavailable" ? (
        <div className="px-3 pb-2">
          <Alert tone="warning">
            <AlertDescription>
              자료실 실시간 연결이 복구될 때까지 자료 구조를 변경할 수 없습니다.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}
      <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
        <Tree aria-label="자료 폴더와 문서" tree={tree}>
          {items.map((item) => {
            return (
              <ResourceTreeRow
                item={item}
                isExpanded={expandedItems.includes(item.getId())}
                key={item.getId()}
                onAction={(node, action) => {
                  setPendingAction({ action, node })
                }}
                scope={scope}
                structureMutationsAllowed={structureMutationsAllowed}
              />
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
        onMove={movePendingNode}
        onRename={renamePendingNode}
        onRestore={restorePendingNode}
        onTrash={trashPendingNode}
      />
    </div>
  )
}

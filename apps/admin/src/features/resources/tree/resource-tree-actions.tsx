"use client"

import { useState, useTransition } from "react"
import {
  ArchiveRestoreIcon,
  FolderInputIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import type { ResourceLibraryApi } from "@/features/resources/resource-library-api"
import type {
  AdminResourceTreeNode,
  AdminResourceTreeScope,
} from "@/lib/api/admin-api"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"
import { Input } from "@workspace/ui/components/ui/input"
import { Spinner } from "@workspace/ui/components/ui/spinner"

export type ResourceTreeAction = "move" | "rename" | "restore" | "trash"

export type ResourceTreeMoveInput = {
  readonly destinationIndex: number
  readonly destinationParentId: string | null
}

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
  readonly api: ResourceLibraryApi
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
      key={`${node.id}:${action}`}
      node={node}
      onClose={onClose}
      onConfirm={action === "trash" ? onTrash : onRestore}
    />
  )
}

function ResourceRenameDialog({
  node,
  onClose,
  onRename,
}: {
  readonly node: AdminResourceTreeNode
  readonly onClose: () => void
  readonly onRename: (name: string) => Promise<string | null>
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(node.name)

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open && !isPending) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이름 변경</DialogTitle>
          <DialogDescription>
            폴더와 문서 이름은 120자까지 입력할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            const normalizedName = name.trim()

            if (normalizedName === "") {
              setErrorMessage("이름을 입력해 주세요.")
              return
            }

            startTransition(async () => {
              const message = await onRename(normalizedName)
              if (message === null) onClose()
              else setErrorMessage(message)
            })
          }}
        >
          <Input
            aria-label="새 이름"
            autoFocus
            disabled={isPending}
            maxLength={120}
            onChange={(event) => {
              setName(event.currentTarget.value)
            }}
            value={name}
          />
          {errorMessage === null ? null : (
            <Alert role="alert" tone="danger">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              취소
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? <Spinner aria-hidden="true" /> : null}
              변경
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type MoveDestination = {
  readonly id: string | null
  readonly name: string
}

function ResourceMoveDialog({
  api,
  node,
  onClose,
  onMove,
}: {
  readonly api: ResourceLibraryApi
  readonly node: AdminResourceTreeNode
  readonly onClose: () => void
  readonly onMove: (input: ResourceTreeMoveInput) => Promise<string | null>
}) {
  const [destination, setDestination] = useState<MoveDestination | null>(null)
  const [destinationChildren, setDestinationChildren] = useState<
    readonly AdminResourceTreeNode[]
  >([])
  const [destinationIndex, setDestinationIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<
    readonly {
      readonly id: string
      readonly name: string
      readonly path: string
    }[]
  >([])

  async function selectDestination(nextDestination: MoveDestination) {
    setDestination(nextDestination)
    setErrorMessage(null)
    const result = await api.getResourceTree({
      parentId: nextDestination.id,
      scope: "active",
    })

    if (result.status === "error") {
      setErrorMessage(result.error.message)
      return
    }

    const children = result.value.nodes.filter((child) => child.id !== node.id)
    setDestinationChildren(children)
    setDestinationIndex(children.length)
  }

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open && !isPending) onClose()
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{node.name} 이동</DialogTitle>
          <DialogDescription>
            최상위 또는 검색한 폴더를 선택한 뒤 배치 위치를 정합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Button
            className="justify-start"
            onClick={() => {
              startTransition(async () => {
                await selectDestination({ id: null, name: "최상위" })
              })
            }}
            type="button"
            variant={destination?.id === null ? "secondary" : "outline"}
          >
            최상위
          </Button>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              const normalizedQuery = query.trim()
              if (normalizedQuery === "") return

              startTransition(async () => {
                const result = await api.searchResources({
                  limit: 50,
                  query: normalizedQuery,
                  scope: "active",
                })

                if (result.status === "error") {
                  setErrorMessage(result.error.message)
                  return
                }

                setErrorMessage(null)
                setResults(
                  result.value.items
                    .filter(
                      (item) => item.kind === "folder" && item.id !== node.id
                    )
                    .map((item) => ({
                      id: item.id,
                      name: item.name,
                      path: [
                        ...item.path.map((part) => part.name),
                        item.name,
                      ].join(" / "),
                    }))
                )
              })
            }}
          >
            <Input
              aria-label="이동할 폴더 검색"
              disabled={isPending}
              onChange={(event) => {
                setQuery(event.currentTarget.value)
              }}
              placeholder="폴더 이름 검색"
              value={query}
            />
            <Button disabled={isPending} type="submit" variant="outline">
              검색
            </Button>
          </form>
          {results.length === 0 ? null : (
            <ul
              aria-label="이동할 폴더 검색 결과"
              className="max-h-40 overflow-y-auto"
            >
              {results.map((result) => (
                <li key={result.id}>
                  <Button
                    className="h-auto w-full justify-start px-2 py-2 text-left"
                    onClick={() => {
                      startTransition(async () => {
                        await selectDestination({
                          id: result.id,
                          name: result.name,
                        })
                      })
                    }}
                    type="button"
                    variant={
                      destination?.id === result.id ? "secondary" : "ghost"
                    }
                  >
                    <span className="truncate">{result.path}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <label className="grid gap-2 text-sm font-medium">
            {destination === null
              ? "이동할 폴더를 먼저 선택하세요."
              : `${destination.name} 안의 배치 위치`}
            <select
              className="h-10 rounded-xl border border-input bg-background px-3"
              disabled={isPending || destination === null}
              onChange={(event) => {
                setDestinationIndex(Number(event.currentTarget.value))
              }}
              value={destinationIndex}
            >
              <option value={0}>맨 앞</option>
              {destinationChildren.map((child, index) => (
                <option key={child.id} value={index + 1}>
                  {child.name} 다음
                </option>
              ))}
            </select>
          </label>
          {errorMessage === null ? null : (
            <Alert role="alert" tone="danger">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              취소
            </Button>
            <Button
              disabled={isPending || destination === null}
              onClick={() => {
                startTransition(async () => {
                  if (destination === null) return
                  const message = await onMove({
                    destinationIndex,
                    destinationParentId: destination.id,
                  })
                  if (message === null) onClose()
                  else setErrorMessage(message)
                })
              }}
              type="button"
            >
              {isPending ? <Spinner aria-hidden="true" /> : null}
              이동
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ResourceStatusDialog({
  action,
  node,
  onClose,
  onConfirm,
}: {
  readonly action: "restore" | "trash"
  readonly node: AdminResourceTreeNode
  readonly onClose: () => void
  readonly onConfirm: () => Promise<string | null>
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const isTrash = action === "trash"

  return (
    <AlertDialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open && !isPending) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isTrash ? "휴지통으로 이동할까요?" : "자료를 복원할까요?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {node.kind === "folder"
              ? isTrash
                ? "폴더와 모든 하위 항목이 함께 휴지통으로 이동합니다."
                : "폴더와 모든 하위 항목이 원래 위치와 이름으로 복원됩니다."
              : isTrash
                ? "문서는 휴지통에서 다시 복원할 수 있습니다."
                : "문서가 원래 위치와 이름으로 복원됩니다."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage === null ? null : (
          <Alert role="alert" tone="danger">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              startTransition(async () => {
                const message = await onConfirm()
                if (message === null) onClose()
                else setErrorMessage(message)
              })
            }}
            variant={isTrash ? "destructive" : "default"}
          >
            {isPending ? <Spinner aria-hidden="true" /> : null}
            {isTrash ? "휴지통으로 이동" : "복원"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

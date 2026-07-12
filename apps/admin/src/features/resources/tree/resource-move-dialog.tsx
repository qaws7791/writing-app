"use client"

import { useState, useTransition } from "react"

import type { ResourceTreeApi } from "@/features/resources/resource-library-api"
import type { AdminResourceTreeNode } from "@/features/resources/resource-library-model"
import type { ResourceTreeMoveInput } from "@/features/resources/tree/resource-tree-types"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/ui/dialog"
import { Input } from "@workspace/ui/components/ui/input"
import { Spinner } from "@workspace/ui/components/ui/spinner"

type MoveDestination = {
  readonly id: string | null
  readonly name: string
}

export function ResourceMoveDialog({
  api,
  node,
  onClose,
  onMove,
}: {
  readonly api: ResourceTreeApi
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

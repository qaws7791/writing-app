"use client"

import { useEffect, useState, useTransition } from "react"
import { UsersIcon } from "lucide-react"

import type { ResourceTreeApi } from "@/features/resources/resource-library-api"
import type { AdminResourceTreeNode } from "@/features/resources/resource-library-model"
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
import { Spinner } from "@workspace/ui/components/ui/spinner"

export function ResourceStatusDialog({
  action,
  api,
  node,
  onClose,
  onConfirm,
}: {
  readonly action: "restore" | "trash"
  readonly api: ResourceTreeApi
  readonly node: AdminResourceTreeNode
  readonly onClose: () => void
  readonly onConfirm: () => Promise<string | null>
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeEditors, setActiveEditors] = useState<ActiveEditorCountState>({
    kind: "loading",
  })
  const [isPending, startTransition] = useTransition()
  const isTrash = action === "trash"

  useEffect(() => {
    if (!isTrash) return

    let isCurrent = true

    async function loadActiveEditorCount(): Promise<void> {
      try {
        const result = await api.getResourceActiveEditorCount(node.id)

        if (!isCurrent) return

        setActiveEditors(
          result.status === "ok"
            ? {
                count: result.value.activeEditorCount,
                kind: "ready",
              }
            : { kind: "error", message: result.error.message }
        )
      } catch {
        if (isCurrent) {
          setActiveEditors({
            kind: "error",
            message: "활성 편집자 수를 불러오지 못했습니다.",
          })
        }
      }
    }

    void loadActiveEditorCount()

    return () => {
      isCurrent = false
    }
  }, [api, isTrash, node.id])

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
        {isTrash ? (
          <div
            aria-label={
              activeEditors.kind === "loading"
                ? "활성 편집자 수를 확인하는 중입니다."
                : activeEditors.kind === "ready"
                  ? `현재 공동 편집 중인 관리자 ${activeEditors.count}명`
                  : "활성 편집자 수를 확인하지 못했습니다."
            }
            aria-live="polite"
            className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm"
            role="status"
          >
            {activeEditors.kind === "loading" ? (
              <Spinner aria-hidden="true" />
            ) : (
              <UsersIcon aria-hidden="true" className="size-4" />
            )}
            <span>
              {activeEditors.kind === "loading"
                ? "활성 편집자 수를 확인하는 중입니다."
                : activeEditors.kind === "ready"
                  ? `현재 공동 편집 중인 관리자 ${activeEditors.count}명`
                  : "활성 편집자 수를 확인하지 못했습니다."}
            </span>
          </div>
        ) : null}
        {activeEditors.kind === "error" ? (
          <Alert role="alert" tone="danger">
            <AlertDescription>{activeEditors.message}</AlertDescription>
          </Alert>
        ) : null}
        {errorMessage === null ? null : (
          <Alert role="alert" tone="danger">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || (isTrash && activeEditors.kind !== "ready")}
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

type ActiveEditorCountState =
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "loading" }
  | { readonly count: number; readonly kind: "ready" }

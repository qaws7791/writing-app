"use client"

import { useState, useTransition } from "react"

import type { AdminResourceTreeNode } from "@/features/resources/resource-library-model"
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

export function ResourceRenameDialog({
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

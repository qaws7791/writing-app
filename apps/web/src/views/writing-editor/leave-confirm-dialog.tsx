"use client"

import { FileTextIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/ui/dialog"

export function LeaveConfirmDialog({
  isSaving,
  onLeaveWithoutSave,
  onOpenChange,
  onSaveAndLeave,
  open,
}: {
  isSaving: boolean
  onLeaveWithoutSave: () => void
  onOpenChange: (open: boolean) => void
  onSaveAndLeave: () => void
  open: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>작성 중인 수필이 있어요</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-[20px] bg-muted">
            <FileTextIcon />
          </div>
          <p className="text-center text-sm leading-6 text-muted-foreground/80">
            지금 나가면 저장되지 않은 내용이 사라질 수 있습니다.
            <br />
            저장 후 나가시겠어요?
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            size="lg"
            onClick={onLeaveWithoutSave}
            className="flex-1"
          >
            그냥 나가기
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={onSaveAndLeave}
            disabled={isSaving}
            className="flex-1"
          >
            임시 저장 후 나가기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useRef } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"

export function LessonExitModal({
  onCancel,
  onConfirm,
}: {
  readonly onCancel: () => void
  readonly onConfirm: () => void
}) {
  const confirmedRef = useRef(false)

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open && !confirmedRef.current) {
          onCancel()
        }
      }}
      open
    >
      <AlertDialogContent>
        <AlertDialogTitle>학습을 중단할까요?</AlertDialogTitle>
        <AlertDialogDescription>
          진행 상황은 자동으로 저장되어 있어요.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>계속 학습</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              confirmedRef.current = true
              onConfirm()
            }}
          >
            나가기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

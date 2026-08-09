"use client"

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
  error,
  isLeaving,
  onCancel,
  onConfirm,
}: {
  readonly error: null | string
  readonly isLeaving: boolean
  readonly onCancel: () => void
  readonly onConfirm: () => void
}) {
  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open && !isLeaving) onCancel()
      }}
      open
    >
      <AlertDialogContent>
        <AlertDialogTitle>학습을 중단할까요?</AlertDialogTitle>
        <AlertDialogDescription>
          코스로 돌아가면 이 레슨을 잠시 멈춥니다.
        </AlertDialogDescription>
        {error === null ? null : (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving} onClick={onCancel}>
            계속 학습
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLeaving}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {isLeaving ? "나가는 중…" : "나가기"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

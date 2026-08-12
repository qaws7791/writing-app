import {
  getConfirmationCopy,
  type ConfirmationIntent,
} from "@/features/course-editor/ui/confirmation-copy"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@workspace/ui/components/primitives/alert-dialog"

export function EditorConfirmationDialog({
  intent,
  onConfirm,
  onDismiss,
}: {
  readonly intent: ConfirmationIntent | null
  readonly onConfirm: () => void
  readonly onDismiss: () => void
}) {
  const copy = getConfirmationCopy(intent)

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) onDismiss()
      }}
      open={intent !== null}
    >
      {copy === null ? null : (
        <AlertDialogContent>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              variant={copy.destructive ? "destructive" : "default"}
            >
              {copy.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
